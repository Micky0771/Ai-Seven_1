import { contextBridge, ipcRenderer } from 'electron';

const subjectsAPI = {
  getSubjects: () => ipcRenderer.invoke('subjects:get'),
  createSubject: (name: string, semester: number, year: number) => 
    ipcRenderer.invoke('subjects:create', name, semester, year),
};

const documentsAPI = {
  processDocument: (filePath: string, subjectId: string) => 
    ipcRenderer.invoke('documents:process', filePath, subjectId),
  getDocuments: (subjectId: string) => 
    ipcRenderer.invoke('documents:getBySubject', subjectId),
};

const aiAPI = {
  chat: (prompt: string, subjectId: string, useContext: boolean = true) => 
    ipcRenderer.invoke('ai:chat', { prompt, subjectId, useContext }),
  checkHealth: () => ipcRenderer.invoke('ai:check-health'),
};

const filesAPI = {
  selectFiles: () => ipcRenderer.invoke('files:select'),
};

contextBridge.exposeInMainWorld('electronAPI', {
  subjects: subjectsAPI,
  documents: documentsAPI,
  ai: aiAPI,
  files: filesAPI
});