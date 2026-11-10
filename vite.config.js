import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // The one chunk over 500 kB is the 3D bracelet preview (three.js, ~260 kB gzipped). It is
    // loaded only when a preview appears in the studio, never on first load.
    chunkSizeWarningLimit: 1000,
  },
  server: {
    proxy: {
      '/api': { target: 'http://localhost:5000', timeout: 0, proxyTimeout: 0 },
      '/uploads': { target: 'http://localhost:5000', timeout: 0, proxyTimeout: 0 },
    },
  },
})
