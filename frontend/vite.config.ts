import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // Prevent the proxy from timing out during long SSE streams.
        // proxyTimeout is how long the proxy waits for a response to START;
        // without this override a slow RAG call can cause the connection to drop.
        proxyTimeout: 120_000,
        timeout: 120_000,
      },
    },
  },
})
