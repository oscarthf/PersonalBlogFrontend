import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
    outDir: 'dist',
    emptyOutDir: true,
  }
})
