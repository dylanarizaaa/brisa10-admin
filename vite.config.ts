import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Preparación para Tauri 2: puerto fijo y sin limpiar la consola,
  // para que el CLI de Tauri pueda conectarse al servidor de desarrollo.
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    // Los cambios en el proyecto de Rust no deben recargar la interfaz.
    watch: { ignored: ['**/src-tauri/**'] },
  },
})
