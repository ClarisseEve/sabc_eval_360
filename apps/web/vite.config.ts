import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      // Appels en même origine, donc sans CORS. VITE_API_PROXY_TARGET permet de
      // développer contre une API distante (ex. Railway) au lieu de l'API locale.
      '/api': { target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000', changeOrigin: true },
    },
  },
})
