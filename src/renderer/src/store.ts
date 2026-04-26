import { create } from 'zustand'

export interface Subject {
  id: string
  name: string
  semester: number
  year: number
  created_at: number
}

export interface Document {
  id: string
  subject_id: string
  file_name: string
  file_type: string
  file_path: string
  indexed_at: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  sources?: any[]
  model?: string
  duration?: number
}

interface AIHealth {
  ollama: boolean
  models: string[]
  chroma: boolean
  timestamp: number
}

interface AppState {
  currentSubject: Subject | null
  subjects: Subject[]
  documents: Document[]
  chatMessages: ChatMessage[]
  isProcessing: boolean
  isLoading: boolean
  isChatLoading: boolean
  error: string | null
  aiHealth: AIHealth | null

  setCurrentSubject: (subject: Subject | null) => void
  loadSubjects: () => Promise<void>
  createSubject: (name: string, semester: number, year: number) => Promise<string>
  deleteSubject: (id: string) => Promise<void>
  loadDocuments: (subjectId: string) => Promise<void>
  processDocument: (filePath: string, subjectId: string) => Promise<boolean>
  sendMessage: (content: string, useContext?: boolean) => Promise<void>
  clearChat: () => void
  checkAIHealth: () => Promise<void>
  selectFiles: () => Promise<string[]>
  setError: (error: string | null) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  currentSubject: null,
  subjects: [],
  documents: [],
  chatMessages: [],
  isProcessing: false,
  isLoading: false,
  isChatLoading: false,
  error: null,
  aiHealth: null,

  setCurrentSubject: (subject) => {
    set({ currentSubject: subject, chatMessages: [] })
    if (subject) {
      get().loadDocuments(subject.id)
    }
  },

  loadSubjects: async () => {
    set({ isLoading: true, error: null })
    try {
      const subjects = await window.electronAPI.subjects.getSubjects()
      set({ subjects, isLoading: false })
    } catch (error: any) {
      set({ error: `Error al cargar ramos: ${error.message}`, isLoading: false })
    }
  },

  createSubject: async (name, semester = 1, year = 2025) => {
    set({ error: null })
    try {
      const id = await window.electronAPI.subjects.createSubject(name, semester, year)
      await get().loadSubjects()
      return id
    } catch (error: any) {
      set({ error: `Error al crear ramo: ${error.message}` })
      throw error
    }
  },

  deleteSubject: async (id) => {
    try {
      await window.electronAPI.subjects.deleteSubject(id)
      const { currentSubject } = get()
      if (currentSubject?.id === id) {
        set({ currentSubject: null, documents: [], chatMessages: [] })
      }
      await get().loadSubjects()
    } catch (error: any) {
      set({ error: `Error al eliminar ramo: ${error.message}` })
    }
  },

  loadDocuments: async (subjectId) => {
    set({ isLoading: true })
    try {
      const documents = await window.electronAPI.documents.getDocuments(subjectId)
      set({ documents, isLoading: false })
    } catch (error: any) {
      set({ error: `Error al cargar documentos: ${error.message}`, isLoading: false })
    }
  },

  processDocument: async (filePath, subjectId) => {
    set({ isProcessing: true, error: null })
    try {
      const result = await window.electronAPI.documents.processDocument(filePath, subjectId)
      if (result.success) {
        await get().loadDocuments(subjectId)
        set({ isProcessing: false })
        return true
      } else {
        set({ error: `Error al procesar: ${result.error}`, isProcessing: false })
        return false
      }
    } catch (error: any) {
      set({ error: `Error al procesar documento: ${error.message}`, isProcessing: false })
      return false
    }
  },

  sendMessage: async (content, useContext = true) => {
    const { currentSubject } = get()
    if (!currentSubject) {
      set({ error: 'Selecciona un ramo primero' })
      return
    }

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now()
    }

    set(state => ({
      chatMessages: [...state.chatMessages, userMessage],
      isChatLoading: true,
      error: null
    }))

    try {
      const response = await window.electronAPI.ai.chat(content, currentSubject.id, useContext)

      if (response.success) {
        const aiMessage: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: response.response,
          timestamp: Date.now(),
          sources: response.sources,
          model: response.model,
          duration: response.duration
        }
        set(state => ({
          chatMessages: [...state.chatMessages, aiMessage],
          isChatLoading: false
        }))
      } else {
        set({ error: `Error de IA: ${response.error}`, isChatLoading: false })
      }
    } catch (error: any) {
      set({ error: `Error en el chat: ${error.message}`, isChatLoading: false })
    }
  },

  clearChat: () => set({ chatMessages: [] }),

  checkAIHealth: async () => {
    try {
      const health = await window.electronAPI.ai.checkHealth()
      set({ aiHealth: health })
    } catch {
      set({ aiHealth: { ollama: false, models: [], chroma: false, timestamp: Date.now() } })
    }
  },

  selectFiles: async () => {
    try {
      const result = await window.electronAPI.files.selectFiles()
      if (!result.canceled) return result.filePaths
      return []
    } catch (error: any) {
      set({ error: `Error al seleccionar archivos: ${error.message}` })
      return []
    }
  },

  setError: (error) => set({ error })
}))
