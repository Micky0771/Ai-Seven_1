import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'ai-seven.db');

class DatabaseManager {
  private db: Database.Database | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    try {
      this.db = new Database(dbPath);
      this.db.pragma('foreign_keys = ON');

      // TABLA ACTUALIZADA: Con Año (year) + Estado (status) + Ruta (folder_path)
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS subjects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          semester TEXT NOT NULL,
          year INTEGER NOT NULL DEFAULT 2026,
          status TEXT NOT NULL DEFAULT 'Activo',
          folder_path TEXT NOT NULL,
          total_seconds INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      this.db.exec(`
        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          subject_id INTEGER,
          name TEXT NOT NULL,
          path TEXT NOT NULL,
          type TEXT NOT NULL,
          size INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
        );
      `);

      this.db.exec(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          subject_id INTEGER,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          sources TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
        );
      `);

      console.log('📦 SQLite: Base de datos inicializada con éxito (Estructura Total).');
    } catch (error) {
      console.error('❌ Error al inicializar las tablas de la base de datos:', error);
      throw error;
    }
  }

  getSubjects() {
    return this.db?.prepare('SELECT * FROM subjects ORDER BY year DESC, semester ASC').all() || [];
  }

  addSubject(name: string, semester: string, year: number, status: string, folderPath: string) {
    if (!this.db) throw new Error("Base de datos no inicializada");
    
    const stmt = this.db.prepare(
      'INSERT INTO subjects (name, semester, year, status, folder_path) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(name, semester, year, status, folderPath);
    return { id: result.lastInsertRowid, name, semester, year, status, folder_path: folderPath };
  }

  deleteSubject(id: number) {
    if (!this.db) throw new Error("Base de datos no inicializada");
    const stmt = this.db.prepare('DELETE FROM subjects WHERE id = ?');
    return stmt.run(id);
  }

  getDocumentsBySubject(subjectId: string) {
    return this.db?.prepare('SELECT * FROM documents WHERE subject_id = ?').all(subjectId) || [];
  }

  addChatMessage(subjectId: string, role: string, content: string, sources?: string[]) {
    if (!this.db) throw new Error("Base de datos no inicializada");
    const stmt = this.db.prepare(
      'INSERT INTO chat_messages (subject_id, role, content, sources) VALUES (?, ?, ?, ?)'
    );
    return stmt.run(subjectId, role, content, sources ? JSON.stringify(sources) : null);
  }
}

export default new DatabaseManager();