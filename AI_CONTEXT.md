# 🧠 AI Development Context: Project AiSeven

> **Instrucciones para la IA:** Este archivo contiene el estado actual, las reglas de negocio y la arquitectura técnica de AiSeven. Léelo antes de sugerir cambios en el código para mantener la coherencia con el Proyecto de Título.

## 1. Identidad del Proyecto
- **Nombre:** AiSeven (Ecosistema de Aprendizaje Local con IA).
- **Misión:** Transformar material académico en contenido interactivo (RAG) con privacidad absoluta (Edge AI).
- **Concepto Clave:** "Local-First". No se permiten llamadas a APIs de nube para procesar datos del usuario (excepto descarga inicial).

## 2. Stack Tecnológico (Sincronizado 2026)
- **Runtime:** Electron v28.3.3 + TypeScript.
- **Frontend:** React + Vite + Tailwind CSS.
- **Persistencia:** - `SQLite` (better-sqlite3): Gestión de perfiles, ramos y progreso (Pomodoro).
    - `ChromaDB`: Almacenamiento de vectores para búsqueda semántica.
- **Motores de IA:**
    - `Ollama` (Llama 3): Inferencia de texto local.
    - `Whisper`: Transcripción de audio local.
    - `Edge-TTS`: Generación de voz para podcasts.

## 3. Reglas de Negocio "Innegociables"
1. **Modo Socrático:** El sistema no debe dar respuestas directas. Debe guiar al usuario con preguntas basadas en el contexto de los documentos cargados.
2. **Jerarquía de Archivos:** Todo debe guardarse en `Documents/AiSeven/[Nombre_Ramo]/`.
3. **Persistencia de Estudio:** Cada 15 segundos de actividad en el Dashboard deben sumarse al contador `total_seconds` en la tabla `subjects`.
4. **Citas Obligatorias:** Cualquier respuesta del chat debe referenciar la fuente: `[Archivo.pdf, pág. X]`.

## 4. Estado del Desarrollo (Febrero 2026)
- [x] Estructura base de Electron + TS.
- [x] DatabaseManager.ts (SQLite funcional).
- [x] OllamaManager.ts (Conexión base).
- [ ] Frontend Profesional (En desarrollo).
- [ ] Pipeline de Ingesta RAG (Pendiente optimización de chunking).

## 5. Instrucciones de Estilo de Código
- Usar **TypeScript** estricto.
- Comunicación Main-Renderer siempre vía **IPC (preload.ts)**.
- Patrón **Singleton** para gestores (Database, Ollama).
- Comentarios en español (para coherencia con la documentación académica).

Para las correcciones de código debes entragar el código completo para reemplazar y así evitar errores