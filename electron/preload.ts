import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // RAMOS (SUBJECTS)
  getSubjects: () => ipcRenderer.invoke('subjects:get'),
  
  // Se define como 'saveSubject' para que React lo encuentre directamente
  saveSubject: (name: string, semester: number, year: number) =>
    ipcRenderer.invoke('subjects:create', name, semester, year),
    
  deleteSubject: (id: string) =>
    ipcRenderer.invoke('subjects:delete', id),

  // DOCUMENTOS
  getDocuments: (subjectId: string) =>
    ipcRenderer.invoke('documents:get', subjectId),
  processDocument: (filePath: string, subjectId: string) =>
    ipcRenderer.invoke('documents:process', filePath, subjectId),
  deleteDocument: (id: string) =>
    ipcRenderer.invoke('documents:delete', id),

  // INTELIGENCIA ARTIFICIAL
  chat: (message: string, subjectId: string, useContext: boolean) =>
    ipcRenderer.invoke('ai:chat', message, subjectId, useContext),
  checkHealth: () =>
    ipcRenderer.invoke('ai:health'),
  getModels: () =>
    ipcRenderer.invoke('ai:models'),

  // SISTEMA Y ARCHIVOS
  selectFiles: () =>
    ipcRenderer.invoke('files:select'),
  getVersion: () => 
    ipcRenderer.invoke('app:version')
})

export {}