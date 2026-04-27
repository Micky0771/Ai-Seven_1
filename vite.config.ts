import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'

export default defineConfig({
  // Vite debe empezar a buscar desde la carpeta renderer
  root: path.join(__dirname, 'src/renderer'),
  
  plugins: [
    react(),
    electron({
      main: {
        entry: path.join(__dirname, 'electron/main.ts'),
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
      },
    }),
  ],
  build: {
    outDir: path.join(__dirname, 'dist'),
  }
})