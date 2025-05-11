import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import glsl from 'vite-plugin-glsl'

export default defineConfig({
  plugins: [
    react(),
    glsl()
  ],
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    hmr: {
      clientPort: 80,
    },
  },
  preview: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist'
  },
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || '/api'),
  }
})