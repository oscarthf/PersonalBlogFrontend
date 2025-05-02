import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    hmr: {
      clientPort: 80, // Important for WebSocket through Nginx
    },
  },
  preview: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist'
  }
})