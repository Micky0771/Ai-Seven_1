import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "path";
import DatabaseManager from "./database/DatabaseManager";
import OllamaManager from "./ai/OllamaManager";
import ChromaManager from "./ai/ChromaManager";
import DocumentProcessor from "./ai/DocumentProcessor";

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
    autoHideMenuBar: true,
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
      setTimeout(() => {
        checkAIServices();
      }, 2000);
    }
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
};

ipcMain.handle("subjects:get", async () => {
  return DatabaseManager.getSubjects();
});

ipcMain.handle(
  "subjects:create",
  async (_, name: string, semester: number, year: number) => {
    return DatabaseManager.addSubject(name, semester, year);
  },
);

ipcMain.handle(
  "documents:process",
  async (_, filePath: string, subjectId: string) => {
    return DocumentProcessor.processDocument(filePath, subjectId);
  },
);

ipcMain.handle("documents:getBySubject", async (_, subjectId: string) => {
  return DatabaseManager.getDocumentsBySubject(subjectId);
});

ipcMain.handle(
  "ai:chat",
  async (_, { prompt, subjectId, useContext = true }) => {
    try {
      let context: string[] = [];

      if (useContext && subjectId) {
        const searchResults = await ChromaManager.search(prompt, { subjectId });
        context = searchResults.map((result) => result.content);
      }

      const response = await OllamaManager.generateResponse(prompt, context);

      if (subjectId) {
        DatabaseManager.addChatMessage(subjectId, "user", prompt);

        const sources =
          context.length > 0
            ? Array.from(new Set(context.map((c) => c.substring(0, 100))))
            : undefined;

        DatabaseManager.addChatMessage(
          subjectId,
          "assistant",
          response.content,
          sources,
        );
      }

      return {
        success: true,
        response: response.content,
        model: response.model,
        duration: response.totalDuration,
        sources:
          context.length > 0
            ? context.map((c, i) => ({
                id: i,
                preview: c.substring(0, 200) + "...",
              }))
            : [],
      };
    } catch (error) {
      console.error("Chat error:", error);
      return {
        success: false,
        error: error.message,
        response: "Error al procesar tu pregunta.",
      };
    }
  },
);

ipcMain.handle("ai:check-health", async () => {
  const [ollamaAvailable, chromaAvailable] = await Promise.all([
    OllamaManager.checkAvailability(),
    ChromaManager.checkConnection(),
  ]);

  return {
    ollama: ollamaAvailable,
    chroma: chromaAvailable,
    timestamp: Date.now(),
  };
});

ipcMain.handle("files:select", async () => {
  if (!mainWindow) return { canceled: true };

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "Documentos", extensions: ["pdf", "txt", "md", "docx", "doc"] },
      { name: "Todos los archivos", extensions: ["*"] },
    ],
  });

  return {
    canceled: result.canceled,
    filePaths: result.filePaths,
  };
});

async function checkAIServices() {
  if (!mainWindow) return;

  try {
    const health = await OllamaManager.checkAvailability(true);

    mainWindow.webContents.send("ai-health-update", {
      ollama: health,
      timestamp: Date.now(),
    });

    if (!health) {
      console.warn(
        "Ollama no disponible. Asegúrate de que esté corriendo en http://localhost:11434",
      );
    }
  } catch (error) {
    console.error("Verificación de salud falló:", error);
  }
}

app.on("ready", () => {
  createWindow();

  setTimeout(() => {
    ChromaManager.checkConnection().catch(console.error);
  }, 1000);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
