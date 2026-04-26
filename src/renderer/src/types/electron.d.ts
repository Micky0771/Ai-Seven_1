export {}

declare global {
  interface Window {
    electronAPI: {
      subjects: {
        getSubjects: () => Promise<any[]>
        createSubject: (name: string, semester: number, year: number) => Promise<string>
        deleteSubject: (id: string) => Promise<boolean>
      }
      documents: {
        getDocuments: (subjectId: string) => Promise<any[]>
        processDocument: (filePath: string, subjectId: string) => Promise<{ success: boolean; error?: string; id?: string }>
        deleteDocument: (id: string) => Promise<boolean>
      }
      ai: {
        chat: (message: string, subjectId: string, useContext: boolean) => Promise<{
          success: boolean
          response?: string
          error?: string
          model?: string
          duration?: number
          sources?: any[]
        }>
        checkHealth: () => Promise<{ ollama: boolean; models: string[]; chroma: boolean; timestamp: number }>
        getModels: () => Promise<string[]>
      }
      files: {
        selectFiles: () => Promise<{ canceled: boolean; filePaths: string[] }>
      }
      app: {
        getVersion: () => Promise<string>
      }
    }
  }
}
