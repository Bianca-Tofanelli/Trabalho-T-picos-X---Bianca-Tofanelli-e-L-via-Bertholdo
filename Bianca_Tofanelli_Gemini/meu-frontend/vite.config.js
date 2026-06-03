import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Toda vez que o React chamar "/api", o Vite joga para a porta 3000!
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})