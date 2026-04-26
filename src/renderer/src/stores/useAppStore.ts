import { create } from 'zustand';

export interface Subject {
    id: string;
    name: string;
    semester: number;
    year: number;
    createdAt: number;
}

export interface Document {
    id: string;
    fileName: string;
    fileType: string;
    filePath: string;
    indexedAt: number;
    metadata?: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    sources?: any[];
    model?: string;
    duration?: number;
}

interface AppState {
    currentSubject: Subject | null;
    subjects: Subject[];
    documents: Document[];
    chatMessages: ChatMessage[];
    
    isProcessing: boolean;
    isLoading: boolean;
    error: string | null;
    
    setCurrentSubject: (subject: Subject | null) => void;
    
    loadSubjects: () => Promise<void>;
    createSubject: (name: string, semester?: number, year?: number) => Promise<string>;
    
    loadDocuments: (subjectId: string) => Promise<void>;
    processDocument: (filePath: string, subjectId: string) => Promise<boolean>;
    
    sendMessage: (content: string, useContext?: boolean) => Promise<void>;
    loadChatHistory: (subjectId: string) => Promise<void>;
    
    checkAIHealth: () => Promise<{ ollama: boolean; chroma: boolean; timestamp: number }>;
    
    selectFiles: () => Promise<string[]>;
    
    setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    currentSubject: null,
    subjects: [],
    documents: [],
    chatMessages: [],
    
    isProcessing: false,
    isLoading: false,
    error: null,
    
    setCurrentSubject: (subject) => {
    set({ currentSubject: subject });
    if (subject) {
        get().loadDocuments(subject.id);
        get().loadChatHistory(subject.id);
    }
    },
    
    loadSubjects: async () => {
    set({ isLoading: true, error: null });
    try {
        const subjects = await window.electronAPI.subjects.getSubjects();
        set({ subjects, isLoading: false });
    } catch (error) {
        set({ error: `Error loading subjects: ${error.message}`, isLoading: false });
    }
    },
    
    createSubject: async (name, semester = 1, year = 2024) => {
    set({ error: null });
    try {
        const id = await window.electronAPI.subjects.createSubject(name, semester, year);
        await get().loadSubjects();
        return id;
    } catch (error) {
        set({ error: `Error creating subject: ${error.message}` });
        throw error;
    }
    },
    
    loadDocuments: async (subjectId) => {
    set({ isLoading: true });
    try {
        const documents = await window.electronAPI.documents.getDocuments(subjectId);
        set({ documents, isLoading: false });
    } catch (error) {
        set({ error: `Error loading documents: ${error.message}`, isLoading: false });
    }
    },
    
    processDocument: async (filePath, subjectId) => {
    set({ isProcessing: true, error: null });
    try {
        const result = await window.electronAPI.documents.processDocument(filePath, subjectId);
        
        if (result.success) {
        await get().loadDocuments(subjectId);
        set({ isProcessing: false });
        return true;
        } else {
        set({ error: `Processing failed: ${result.error}`, isProcessing: false });
        return false;
        }
    } catch (error) {
        set({ error: `Error processing document: ${error.message}`, isProcessing: false });
        return false;
    }
    },
    
    sendMessage: async (content, useContext = true) => {
    const { currentSubject } = get();
    if (!currentSubject) {
        set({ error: 'No subject selected' });
        return;
    }
    
    const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content,
        timestamp: Date.now()
    };
    
    set(state => ({
        chatMessages: [...state.chatMessages, userMessage],
        error: null
    }));
    
    try {
        const response = await window.electronAPI.ai.chat(content, currentSubject.id, useContext);
        
        if (response.success) {
        const aiMessage: ChatMessage = {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: response.response,
            timestamp: Date.now(),
            sources: response.sources,
            model: response.model,
            duration: response.duration
        };
        
        set(state => ({
            chatMessages: [...state.chatMessages, aiMessage]
        }));
        } else {
        set({ error: `AI Error: ${response.error}` });
        }
    } catch (error) {
        set({ error: `Chat error: ${error.message}` });
    }
    },
    
    loadChatHistory: async (subjectId) => {
    try {
      // Nota: Necesitarías implementar un endpoint para obtener el historial
      // Por ahora, solo cargamos desde el estado local
        console.log('Loading chat history for subject:', subjectId);
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
    },
    
    checkAIHealth: async () => {
    try {
        const health = await window.electronAPI.ai.checkHealth();
        return health;
    } catch (error) {
        return { ollama: false, chroma: false, timestamp: Date.now() };
    }
    },
    
    selectFiles: async () => {
    try {
        const result = await window.electronAPI.files.selectFiles();
        if (!result.canceled) {
        return result.filePaths;
        }
        return [];
    } catch (error) {
        set({ error: `Error selecting files: ${error.message}` });
        return [];
    }
    },
    
    setError: (error) => set({ error }),
}));