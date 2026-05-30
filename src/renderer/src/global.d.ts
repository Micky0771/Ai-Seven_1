export {}

declare global {
  interface Window {
    electronAPI: {
      subjects: {
        getSubjects: () => Promise<any[]>;
        createSubject: (name: string, semester: string, status: string, folderPath: string) => Promise<any>;
        deleteSubject: (id: number) => Promise<any>;
      };
      documents: {
        processDocument: (filePath: string, subjectId: string) => Promise<any>;
        getDocuments: (subjectId: string) => Promise<any[]>;
      };
      ai: {
        chat: (prompt: string, subjectId: string, useContext?: boolean) => Promise<any>;
        checkHealth: () => Promise<boolean>;
      };
      files: {
        selectFiles: () => Promise<string[] | null>;
        selectFolder: () => Promise<string | null>;
      };
    };
  }
}