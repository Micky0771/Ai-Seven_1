import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

export default defineConfig({
  root: 'src/renderer',
  base: './',
  plugins: [
    react(),
    electron([
      {
        entry: 'src/main/main.ts',
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron'),
            emptyOutDir: false,
            rollupOptions: {
              external: ['electron', 'sql.js', 'node-fetch', 'uuid', 'fs', 'path', 'os']
            }
          }
        }
      },
      {
        entry: 'src/main/preload.ts',
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron'),
            emptyOutDir: false,
            rollupOptions: {
              external: ['electron']
            }
          }
        },
        onstart(options) {
          options.reload()
        }
      }
    ]),
    renderer()
  ],
  build: {
    outDir: path.resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer/src')
    }
  }
})
