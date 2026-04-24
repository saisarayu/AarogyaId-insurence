import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/recommend': 'http://127.0.0.1:8000',
      '/chat': 'http://127.0.0.1:8000',
      '/upload-policy': 'http://127.0.0.1:8000',
      '/policies': 'http://127.0.0.1:8000',
      '/delete-policy': 'http://127.0.0.1:8000',
    },
  },
})

