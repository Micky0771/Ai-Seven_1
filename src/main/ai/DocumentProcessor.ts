import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { extractText } from "mammoth";
import pdfParse from "pdf-parse";
import DatabaseManager from "../database/DatabaseManager";
import ChromaManager from "./ChromaManager";

export interface ProcessResult {
  success: boolean;
  documentId?: string;
  chunks?: number;
  error?: string;
  textLength?: number;
  processingTime?: number;
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

class DocumentProcessor {
  async getFileInfo(filePath: string): Promise<FileInfo> {
    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();

      return {
        path: filePath,
        name: path.basename(filePath),
        size: stats.size,
        type: this.getFileType(ext),
        lastModified: stats.mtimeMs,
      };
    } catch (error) {
      throw new Error(`No se puede acceder al archivo: ${error.message}`);
    }
  }

  private getFileType(extension: string): string {
    const types: Record<string, string> = {
      ".pdf": "pdf",
      ".txt": "txt",
      ".md": "txt",
      ".docx": "docx",
      ".doc": "docx",
      ".rtf": "rtf",
    };

    return types[extension] || "other";
  }

  async calculateFileHash(filePath: string): Promise<string> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      return crypto.createHash("sha256").update(fileBuffer).digest("hex");
    } catch (error) {
      throw new Error(`Error calculando hash: ${error.message}`);
    }
  }

  async extractTextFromFile(filePath: string): Promise<{
    text: string;
    metadata: Record<string, any>;
  }> {
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);

    console.log(`Extrayendo texto de ${fileName} (${ext})`);

    try {
      let text = "";
      let metadata: Record<string, any> = {
        fileName,
        extension: ext,
        processedAt: Date.now(),
      };

      switch (ext) {
        case ".pdf":
          const pdfResult = await this.extractFromPDF(filePath);
          text = pdfResult.text;
          metadata = { ...metadata, ...pdfResult.metadata };
          break;

        case ".txt":
        case ".md":
        case ".rtf":
          text = await fs.readFile(filePath, "utf-8");
          metadata.encoding = "utf-8";
          break;

        case ".docx":
        case ".doc":
          const docxResult = await this.extractFromDOCX(filePath);
          text = docxResult.text;
          metadata = { ...metadata, ...docxResult.metadata };
          break;

        default:
          throw new Error(
            `Formato no soportado: ${ext}. Soporta: PDF, TXT, MD, DOCX, DOC, RTF`,
          );
      }

      if (!text.trim()) {
        throw new Error("El archivo está vacío o no se pudo extraer texto");
      }

      return {
        text: text.trim(),
        metadata,
      };
    } catch (error) {
      console.error(`Error extrayendo de ${filePath}:`, error);
      throw new Error(`Error procesando ${fileName}: ${error.message}`);
    }
  }

  private async extractFromPDF(filePath: string): Promise<{
    text: string;
    metadata: Record<string, any>;
  }> {
    try {
      const pdfBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(pdfBuffer);

      return {
        text: pdfData.text,
        metadata: {
          numPages: pdfData.numpages,
          pdfInfo: pdfData.info || {},
          textLength: pdfData.text.length,
        },
      };
    } catch (error) {
      throw new Error(`Error parseando PDF: ${error.message}`);
    }
  }

  private async extractFromDOCX(filePath: string): Promise<{
    text: string;
    metadata: Record<string, any>;
  }> {
    try {
      const result = await extractText({
        path: filePath,
        includeEmbedded: false,
      });

      return {
        text: result.value,
        metadata: {
          rawText: result.rawText || "",
          messages: result.messages || [],
        },
      };
    } catch (error) {
      throw new Error(`Error parseando DOCX: ${error.message}`);
    }
  }

  async processDocument(
    filePath: string,
    subjectId: string,
  ): Promise<ProcessResult> {
    const startTime = Date.now();

    try {
      console.log(`Procesando documento: ${filePath}`);

      const fileInfo = await this.getFileInfo(filePath);
      const fileHash = await this.calculateFileHash(filePath);

      if (DatabaseManager.documentExists(fileHash)) {
        console.log(
          `Documento ya existe (hash: ${fileHash.substring(0, 16)}...)`,
        );
        return {
          success: true,
          documentId: "existing",
          chunks: 0,
          textLength: 0,
          processingTime: Date.now() - startTime,
          error: "Documento ya indexado",
        };
      }

      const { text, metadata } = await this.extractTextFromFile(filePath);

      if (text.length < 50) {
        throw new Error(`Texto muy corto (${text.length} caracteres)`);
      }

      console.log(`Extraídos ${text.length} caracteres de ${fileInfo.name}`);

      const chunksAdded = await ChromaManager.addDocument(text, {
        documentId: `temp_${Date.now()}`,
        fileName: fileInfo.name,
        fileType: fileInfo.type,
        subjectId,
        fileHash,
        originalPath: filePath,
        ...metadata,
      });

      const documentId = DatabaseManager.addDocument({
        subjectId,
        filePath,
        fileName: fileInfo.name,
        fileType: fileInfo.type as any,
        fileHash,
        metadata: JSON.stringify(metadata),
      });

      const processingTime = Date.now() - startTime;

      console.log(
        `Procesado exitosamente ${fileInfo.name}: ${chunksAdded} fragmentos en ${processingTime}ms`,
      );

      return {
        success: true,
        documentId,
        chunks: chunksAdded,
        textLength: text.length,
        processingTime,
      };
    } catch (error) {
      console.error("Procesamiento de documento falló:", error);

      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime,
      };
    }
  }

  async validateDocument(filePath: string): Promise<{
    valid: boolean;
    errors: string[];
    info?: FileInfo;
  }> {
    const errors: string[] = [];

    try {
      await fs.access(filePath);
      const info = await this.getFileInfo(filePath);

      if (info.size > 50 * 1024 * 1024) {
        errors.push(
          `Archivo muy grande (${(info.size / 1024 / 1024).toFixed(2)} MB). Máximo: 50MB`,
        );
      }

      const supportedTypes = ["pdf", "txt", "docx"];
      if (!supportedTypes.includes(info.type)) {
        errors.push(
          `Tipo no soportado: ${info.type}. Soporta: ${supportedTypes.join(", ")}`,
        );
      }

      return {
        valid: errors.length === 0,
        errors,
        info,
      };
    } catch (error) {
      errors.push(`Error de acceso: ${error.message}`);
      return {
        valid: false,
        errors,
      };
    }
  }
}

export default new DocumentProcessor();
