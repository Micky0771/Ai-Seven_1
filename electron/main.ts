import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import fetch from 'node-fetch'
import { v4 as uuidv4 } from 'uuid'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
const OLLAMA_BASE_URL = 'http://localhost:11434'
const OLLAMA_MODEL = 'llama3'

let db: any = null
const dbPath = path.join(app.getPath('userData'), 'aiseven.db')

async function initDatabase() {
  const initSqlJs = require('sql.js')
  const SQL = await initSqlJs()

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      semester INTEGER DEFAULT 1,
      year INTEGER DEFAULT 2025,
      created_at INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
    );
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      content TEXT,
      indexed_at INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
    );
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      model TEXT,
      duration INTEGER,
      created_at INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
    );
  `)

  saveDb()
  console.log('[DB] Inicializada en:', dbPath)
}

function saveDb() {
  if (!db) return
  const data = db.export()
  fs.writeFileSync(dbPath, Buffer.from(data))
}

function dbAll(sql: string, params: any[] = []): any[] {
  try {
    const stmt = db.prepare(sql)
    const rows: any[] = []
    stmt.bind(params)
    while (stmt.step()) rows.push(stmt.getAsObject())
    stmt.free()
    return rows
  } catch (e) {
    console.error('[DB] Error:', e)
    return []
  }
}

function dbRun(sql: string, params: any[] = []) {
  db.run(sql, params)
  saveDb()
}

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => { mainWindow = null })
}

ipcMain.handle('subjects:get', () =>
  dbAll('SELECT * FROM subjects ORDER BY year DESC, semester DESC, name ASC')
)

ipcMain.handle('subjects:create', (_e, name: string, semester: number, year: number) => {
  const id = uuidv4()
  dbRun('INSERT INTO subjects (id, name, semester, year) VALUES (?, ?, ?, ?)', [id, name, semester, year])
  return id
})

ipcMain.handle('subjects:delete', (_e, id: string) => {
  dbRun('DELETE FROM documents WHERE subject_id = ?', [id])
  dbRun('DELETE FROM chat_messages WHERE subject_id = ?', [id])
  dbRun('DELETE FROM subjects WHERE id = ?', [id])
  return true
})

ipcMain.handle('documents:get', (_e, subjectId: string) =>
  dbAll('SELECT * FROM documents WHERE subject_id = ? ORDER BY indexed_at DESC', [subjectId])
)

ipcMain.handle('documents:process', async (_e, filePath: string, subjectId: string) => {
  try {
    if (!fs.existsSync(filePath)) return { success: false, error: 'Archivo no encontrado' }
    const fileName = path.basename(filePath)
    const ext = path.extname(filePath).toLowerCase()
    if (!['.txt', '.md', '.pdf', '.docx'].includes(ext))
      return { success: false, error: `Tipo no soportado: ${ext}` }

    let content = ''
    if (ext === '.txt' || ext === '.md') {
      content = fs.readFileSync(filePath, 'utf-8')
    } else {
      content = `[${fileName}] — Extracción de contenido pendiente (${ext})`
    }

    const id = uuidv4()
    dbRun(
      'INSERT INTO documents (id, subject_id, file_name, file_type, file_path, content, indexed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, subjectId, fileName, ext, filePath, content, Date.now()]
    )
    return { success: true, id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('documents:delete', (_e, id: string) => {
  dbRun('DELETE FROM documents WHERE id = ?', [id])
  return true
})

ipcMain.handle('ai:health', async () => {
  try {
    const res = await (fetch as any)(`${OLLAMA_BASE_URL}/api/tags`, { signal: AbortSignal.timeout(3000) })
    const data = await res.json() as any
    return { ollama: true, models: data.models?.map((m: any) => m.name) ?? [], chroma: false, timestamp: Date.now() }
  } catch {
    return { ollama: false, models: [], chroma: false, timestamp: Date.now() }
  }
})

ipcMain.handle('ai:models', async () => {
  try {
    const res = await (fetch as any)(`${OLLAMA_BASE_URL}/api/tags`)
    const data = await res.json() as any
    return data.models?.map((m: any) => m.name) ?? []
  } catch { return [] }
})

ipcMain.handle('ai:chat', async (_e, message: string, subjectId: string, useContext: boolean) => {
  const start = Date.now()
  try {
    let contextText = ''
    if (useContext) {
      const docs = dbAll('SELECT file_name, content FROM documents WHERE subject_id = ?', [subjectId])
      if (docs.length > 0) {
        contextText = docs.map((d: any) =>
          `--- ${d.file_name} ---\n${String(d.content ?? '').substring(0, 2000)}`
        ).join('\n\n')
      }
    }

    const systemPrompt = contextText
      ? `Eres AiSeven, un asistente académico. Responde SOLO con este material:\n\n${contextText}\n\nSi la respuesta no está en el material, indícalo.`
      : `Eres AiSeven, un asistente académico. Ayuda al estudiante de forma clara y educativa.`

    dbRun('INSERT INTO chat_messages (id, subject_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), subjectId, 'user', message, Date.now()])

    const res = await (fetch as any)(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        stream: false
      }),
      signal: AbortSignal.timeout(60000)
    })

    if (!res.ok) throw new Error(`Ollama error ${res.status}`)

    const data = await res.json() as any
    const response = data.message?.content ?? 'Sin respuesta'
    const duration = Date.now() - start

    dbRun('INSERT INTO chat_messages (id, subject_id, role, content, model, duration, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), subjectId, 'assistant', response, OLLAMA_MODEL, duration, Date.now()])

    return { success: true, response, model: OLLAMA_MODEL, duration, sources: [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('files:select', async () => {
  return dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Documentos', extensions: ['txt', 'md', 'pdf', 'docx'] },
      { name: 'Todos', extensions: ['*'] }
    ]
  })
})

ipcMain.handle('app:version', () => app.getVersion())

app.whenReady().then(async () => {
  await initDatabase()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    saveDb()
    app.quit()
  }
})
