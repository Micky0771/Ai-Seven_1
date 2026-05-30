import { create } from 'zustand'

export interface Subject { id: string; name: string; semester: number; year: number; created_at: number }
export interface Document { id: string; subject_id: string; file_name: string; file_type: string; file_path: string; indexed_at: number }
export interface ChatMessage { id: string; role: 'user' | 'assistant'; content: string; timestamp: number; model?: string; duration?: number }

interface AppState {
  currentSubject: Subject | null
  subjects: Subject[]
  documents: Document[]
  chatMessages: ChatMessage[]
  isProcessing: boolean
  isLoading: boolean
  isChatLoading: boolean
  error: string | null
  aiHealth: { ollama: boolean; models: string[]; timestamp: number } | null

  setCurrentSubject: (s: Subject | null) => void
  loadSubjects: () => Promise<void>
  createSubject: (name: string, semester: number, year: number) => Promise<string>
  deleteSubject: (id: string) => Promise<void>
  loadDocuments: (subjectId: string) => Promise<void>
  processDocument: (filePath: string, subjectId: string) => Promise<boolean>
  sendMessage: (content: string, useContext?: boolean) => Promise<void>
  clearChat: () => void
  checkAIHealth: () => Promise<void>
  selectFiles: () => Promise<string[]>
  setError: (e: string | null) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  currentSubject: null, subjects: [], documents: [], chatMessages: [],
  isProcessing: false, isLoading: false, isChatLoading: false, error: null, aiHealth: null,

  setCurrentSubject: (subject) => {
    set({ currentSubject: subject, chatMessages: [] })
    if (subject) get().loadDocuments(subject.id)
  },

  loadSubjects: async () => {
    set({ isLoading: true })
    try {
      const subjects = await window.electronAPI.subjects.getSubjects()
      set({ subjects, isLoading: false })
    } catch (e: any) { set({ error: e.message, isLoading: false }) }
  },

  createSubject: async (name, semester = 1, year = 2025) => {
    try {
      const id = await window.electronAPI.subjects.createSubject(name, semester, year)
      await get().loadSubjects()
      return id
    } catch (e: any) { set({ error: e.message }); throw e }
  },

  deleteSubject: async (id) => {
    try {
      await window.electronAPI.subjects.deleteSubject(id)
      if (get().currentSubject?.id === id) set({ currentSubject: null, documents: [], chatMessages: [] })
      await get().loadSubjects()
    } catch (e: any) { set({ error: e.message }) }
  },

  loadDocuments: async (subjectId) => {
    try {
      const documents = await window.electronAPI.documents.getDocuments(subjectId)
      set({ documents })
    } catch (e: any) { set({ error: e.message }) }
  },

  processDocument: async (filePath, subjectId) => {
    set({ isProcessing: true })
    try {
      const result = await window.electronAPI.documents.processDocument(filePath, subjectId)
      if (result.success) { await get().loadDocuments(subjectId); set({ isProcessing: false }); return true }
      set({ error: result.error, isProcessing: false }); return false
    } catch (e: any) { set({ error: e.message, isProcessing: false }); return false }
  },

  sendMessage: async (content, useContext = true) => {
    const { currentSubject } = get()
    if (!currentSubject) { set({ error: 'Selecciona un ramo primero' }); return }

    set(s => ({
      chatMessages: [...s.chatMessages, { id: `u_${Date.now()}`, role: 'user', content, timestamp: Date.now() }],
      isChatLoading: true, error: null
    }))

    try {
      const res = await window.electronAPI.ai.chat(content, currentSubject.id, useContext)
      if (res.success) {
        set(s => ({
          chatMessages: [...s.chatMessages, {
            id: `a_${Date.now()}`, role: 'assistant', content: res.response!,
            timestamp: Date.now(), model: res.model, duration: res.duration
          }],
          isChatLoading: false
        }))
      } else { set({ error: res.error, isChatLoading: false }) }
    } catch (e: any) { set({ error: e.message, isChatLoading: false }) }
  },

  clearChat: () => set({ chatMessages: [] }),

  checkAIHealth: async () => {
    try {
      const health = await window.electronAPI.ai.checkHealth()
      set({ aiHealth: health })
    } catch { set({ aiHealth: { ollama: false, models: [], timestamp: Date.now() } }) }
  },

  selectFiles: async () => {
    try {
      const result = await window.electronAPI.files.selectFiles()
      return result.canceled ? [] : result.filePaths
    } catch (e: any) { set({ error: e.message }); return [] }
  },

  setError: (error) => set({ error })
}))
