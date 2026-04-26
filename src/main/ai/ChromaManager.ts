import { Chroma } from "@langchain/community/vectorstores/chroma";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { v4 as uuidv4 } from "uuid";

export interface SearchResult {
  content: string;
  metadata: {
    documentId: string;
    fileName: string;
    fileType: string;
    subjectId: string;
    timestamp: number;
    [key: string]: any;
  };
  score: number;
}

class ChromaManager {
  private vectorStore: Chroma | null = null;
  private embeddings: HuggingFaceTransformersEmbeddings | null = null;
  private collectionName = "aiseven_docs";
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log("Inicializando ChromaDB...");

      this.embeddings = new HuggingFaceTransformersEmbeddings({
        model: "Xenova/all-MiniLM-L6-v2",
        maxTokens: 512,
      });

      console.log("Modelo de embeddings cargado");

      this.vectorStore = await Chroma.fromExistingCollection(this.embeddings, {
        collectionName: this.collectionName,
        url: "http://localhost:8000",
      });

      this.isInitialized = true;
      console.log("Conectado a ChromaDB");
    } catch (error) {
      console.error("Error inicializando ChromaDB:", error);

      try {
        console.log("Creando nueva colección en ChromaDB...");

        this.vectorStore = await Chroma.fromTexts(
          ["Documento inicial"],
          [{ id: "init", timestamp: Date.now() }],
          this.embeddings!,
          {
            collectionName: this.collectionName,
            url: "http://localhost:8000",
          },
        );

        this.isInitialized = true;
        console.log("Nueva colección creada");
      } catch (createError) {
        console.error("Error creando colección:", createError);
        throw new Error(
          "ChromaDB no disponible. Asegúrate de que está corriendo en http://localhost:8000",
        );
      }
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.initialize();
      return true;
    } catch (error) {
      console.warn("Conexión a ChromaDB falló:", error.message);
      return false;
    }
  }

  async addDocument(
    text: string,
    metadata: {
      documentId: string;
      fileName: string;
      fileType: string;
      subjectId: string;
      [key: string]: any;
    },
  ): Promise<number> {
    await this.initialize();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ["\n\n", "\n", ". ", "! ", "? ", "; ", ": ", ", ", " "],
    });

    const chunks = await splitter.createDocuments(
      [text],
      [
        {
          ...metadata,
          chunkId: uuidv4(),
          processedAt: Date.now(),
        },
      ],
      {
        chunkHeader: `Documento: ${metadata.fileName}\n\n`,
      },
    );

    console.log(`Documento dividido en ${chunks.length} fragmentos`);

    await this.vectorStore!.addDocuments(chunks);

    return chunks.length;
  }

  async search(
    query: string,
    filters?: { subjectId?: string; fileType?: string },
    k: number = 4,
  ): Promise<SearchResult[]> {
    await this.initialize();

    let filter: any = {};
    if (filters?.subjectId) {
      filter.subjectId = filters.subjectId;
    }
    if (filters?.fileType) {
      filter.fileType = filters.fileType;
    }

    try {
      const results = await this.vectorStore!.similaritySearchWithScore(
        query,
        k,
        Object.keys(filter).length > 0 ? filter : undefined,
      );

      return results.map(([doc, score]) => ({
        content: doc.pageContent,
        metadata: doc.metadata as SearchResult["metadata"],
        score: score,
      }));
    } catch (error) {
      console.error("Error en búsqueda:", error);
      return [];
    }
  }

  async searchByDocument(
    documentId: string,
    query?: string,
    k: number = 10,
  ): Promise<SearchResult[]> {
    await this.initialize();

    try {
      const results = await this.vectorStore!.similaritySearchWithScore(
        query || "",
        k,
        { documentId },
      );

      return results.map(([doc, score]) => ({
        content: doc.pageContent,
        metadata: doc.metadata as SearchResult["metadata"],
        score: score,
      }));
    } catch (error) {
      console.error("Error buscando por documento:", error);
      return [];
    }
  }

  async getStats(): Promise<{
    totalChunks: number;
    subjects: Record<string, number>;
    documentTypes: Record<string, number>;
  }> {
    await this.initialize();

    try {
      const sampleResults = await this.vectorStore!.similaritySearchWithScore(
        "",
        1000,
      );

      const subjects: Record<string, number> = {};
      const documentTypes: Record<string, number> = {};

      sampleResults.forEach(([doc]) => {
        const metadata = doc.metadata as any;

        if (metadata.subjectId) {
          subjects[metadata.subjectId] =
            (subjects[metadata.subjectId] || 0) + 1;
        }

        if (metadata.fileType) {
          documentTypes[metadata.fileType] =
            (documentTypes[metadata.fileType] || 0) + 1;
        }
      });

      return {
        totalChunks: sampleResults.length,
        subjects,
        documentTypes,
      };
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);
      return {
        totalChunks: 0,
        subjects: {},
        documentTypes: {},
      };
    }
  }
}

export default new ChromaManager();
