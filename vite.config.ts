import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libs
          react: ['react', 'react-dom'],
          // Visualization heavy libs
          charts: ['recharts'],
          motion: ['framer-motion']
        }
      }
    }
  }
})
