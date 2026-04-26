import { contextBridge, ipcRenderer } from 'electron'

// Exponer APIs seguras al renderer (React)
contextBridge.exposeInMainWorld('electronAPI', {
  subjects: {
    getSubjects: () => ipcRenderer.invoke('subjects:get'),
    createSubject: (name: string, semester: number, year: number) =>
      ipcRenderer.invoke('subjects:create', name, semester, year),
    deleteSubject: (id: string) =>
      ipcRenderer.invoke('subjects:delete', id),
  },
  documents: {
    getDocuments: (subjectId: string) =>
      ipcRenderer.invoke('documents:get', subjectId),
    processDocument: (filePath: string, subjectId: string) =>
      ipcRenderer.invoke('documents:process', filePath, subjectId),
    deleteDocument: (id: string) =>
      ipcRenderer.invoke('documents:delete', id),
  },
  ai: {
    chat: (message: string, subjectId: string, useContext: boolean) =>
      ipcRenderer.invoke('ai:chat', message, subjectId, useContext),
    checkHealth: () =>
      ipcRenderer.invoke('ai:health'),
    getModels: () =>
      ipcRenderer.invoke('ai:models'),
  },
  files: {
    selectFiles: () =>
      ipcRenderer.invoke('files:select'),
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:version'),
  }
})

// Tipos para TypeScript en el renderer
export {}
