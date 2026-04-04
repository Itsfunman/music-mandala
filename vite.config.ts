import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '/music-mandala/',
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
})