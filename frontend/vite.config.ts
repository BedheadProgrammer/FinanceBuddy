import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Anything starting with /api goes to Django
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        // If your Django API doesn't expect the /api prefix, uncomment:
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})