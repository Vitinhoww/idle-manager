import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'src/main/index.js',
        onstart(options) {
          options.startup()
        },
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: { external: ['electron', 'electron-store'] }
          }
        }
      },
      {
        entry: 'src/preload/preload.js',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron/preload',
            rollupOptions: { external: ['electron'] }
          }
        }
      }
    ]),
    renderer()
  ],
  server: { port: 5173 }
})
