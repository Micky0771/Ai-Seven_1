Aquí tienes un resumen técnico detallado de todo lo que hemos trabajado y corregido en **Ai-Seven**. Puedes guardar este texto en un archivo (por ejemplo, `NOTAS_DESARROLLO.md`) y pegármelo en nuestra próxima sesión para que sepa exactamente en qué punto nos quedamos.

---

### 📝 Resumen de Desarrollo: Proyecto Ai-Seven

**1. Estado de la Infraestructura:**
* **Tecnologías:** Electron + React + Vite + SQLite.
* **Base de Datos:** Se configuró SQLite con una base de datos llamada `aiseven.db` que maneja tablas para `subjects` (ramos), `documents` y `chat_messages`.
* **Repositorio:** Sincronizado en GitHub (`Ai-Seven_1`).

**2. Problemas Críticos Resueltos:**
* **Rutas de Renderizado:** Se corrigió el archivo `index.html` y la configuración de `vite.config.ts` para que el "root" apunte correctamente a `src/renderer`, permitiendo que la aplicación cargue la interfaz de React.
* **El Puente (Preload API):** Se identificó que el Frontend intentaba llamar a funciones que no existían o que estaban mal nombradas. Se realizó un **"aplanamiento" de la API** en `electron/preload.ts`.
* **Sincronización de Nombres:** Se cambió el nombre de la función `createSubject` a **`saveSubject`** en el objeto `electronAPI` para coincidir exactamente con las llamadas que realiza el código de React.

**3. Archivos Clave Configurados:**
* **`electron/preload.ts`:** Ahora expone funciones directas como `window.electronAPI.saveSubject` y `window.electronAPI.getSubjects`.
* **`electron/main.ts`:** Contiene los manejadores (`ipcMain.handle`) para interactuar con SQLite (crear, listar y borrar ramos).
* **`vite.config.ts`:** Configurado para compilar tanto el proceso principal de Electron como el renderizador de React de forma integrada.

**4. Pendiente para la próxima sesión:**
* **Verificación de Guardado:** Confirmar si tras el reinicio "en frío" (`npm run dev`) el botón "+ Nuevo Ramo" logra insertar datos en la DB sin el error de `saveSubject is not a function`.
* **Carga de Datos:** Verificar que la lista de ramos se actualice automáticamente en el Sidebar tras crear uno nuevo.

---

**Instrucción para el futuro:** *"Carga el resumen anterior para entender la estructura de la API aplanada y el cambio de nombre de createSubject a saveSubject."*