import { create } from 'zustand';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id: string;
  timestamp: number;
  model?: string;
  duration?: number;
}

export interface Subject {
  id: string;
  name: string;
  semester: string;
  year: string;
  status: string;
  total_seconds: number;
  folder_path: string;
}

interface AppState {
  subjects: Subject[];
  currentSubject: Subject | null;
  documents: any[];
  chatMessages: ChatMessage[];
  isLoading: boolean;
  isChatLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  aiHealth: { status: string; ollama: boolean; models: string[] } | null;

  loadSubjects: () => Promise<void>;
  createSubject: (name: string, semester: string, year: string) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  fetchDocuments: (subjectName: string) => Promise<void>;
  processDocument: (filePath: string, subjectId: string) => Promise<void>;
  sendMessage: (content: string, useContext?: boolean) => Promise<void>;
  setCurrentSubject: (subject: Subject | null) => void;
  setError: (error: string | null) => void;
  checkAIHealth: () => Promise<void>;
  clearChat: () => void;
  selectFiles: () => Promise<string[]>;
}

export const useAppStore = create<AppState>((set, get) => ({
  subjects: [],
  currentSubject: null,
  documents: [],
  chatMessages: [],
  isLoading: false,
  isChatLoading: false,
  isProcessing: false,
  error: null,
  aiHealth: { status: 'ok', ollama: true, models: ['Llama 3'] },

  setCurrentSubject: (subject) => set({ currentSubject: subject }),
  setError: (error) => set({ error }),
  clearChat: () => set({ chatMessages: [] }),

  loadSubjects: async () => {
    set({ isLoading: true });
    try {
      const subjects = await (window as any).electronAPI.getSubjects();
      set({ subjects: subjects || [], isLoading: false });
    } catch (error: any) {
      set({ error: `Error: ${error.message}`, isLoading: false });
    }
  },

  checkAIHealth: async () => {
    set({ aiHealth: { status: 'ok', ollama: true, models: ['Llama 3'] } });
  },

  createSubject: async (name, semester, year) => {
    try {
      await (window as any).electronAPI.saveSubject({ 
        name, 
        semester: String(semester), 
        year: String(year) 
      });
      get().loadSubjects();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteSubject: async (id) => {
    try {
      await (window as any).electronAPI.deleteSubject(id);
      get().loadSubjects();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchDocuments: async (subjectName) => {
    set({ isLoading: true });
    try {
      const docs = await (window as any).electronAPI.getDocuments(subjectName);
      set({ documents: docs || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  processDocument: async (filePath, subjectId) => {
    set({ isProcessing: true });
    try {
      await (window as any).electronAPI.processDocument(filePath, subjectId);
      get().fetchDocuments(get().currentSubject?.name || '');
      set({ isProcessing: false });
    } catch (error: any) {
      set({ error: error.message, isProcessing: false });
    }
  },

  sendMessage: async (content, useContext = true) => {
    const { chatMessages, currentSubject } = get();
    const newMessages: ChatMessage[] = [
      ...chatMessages, 
      { role: 'user', content, timestamp: Date.now(), id: Date.now().toString() }
    ];
    set({ chatMessages: newMessages, isChatLoading: true });
    try {
      const response = await (window as any).electronAPI.chat({
        message: content,
        subject: useContext ? currentSubject?.name : undefined
      });
      set({
        chatMessages: [
          ...newMessages,
          { 
            role: 'assistant', 
            content: response?.response ?? '',
            timestamp: Date.now(),
            id: (Date.now() + 1).toString(),
            model: 'AiSeven Llama 3',
            duration: response?.duration || 0
          }
        ],
        isChatLoading: false
      });
    } catch (error: any) {
      set({ error: error.message, isChatLoading: false });
    }
  },

  selectFiles: async () => {
    try {
      return await (window as any).electronAPI.selectFiles();
    } catch (error: any) {
      set({ error: error.message });
      return [];
    }
  }
}));