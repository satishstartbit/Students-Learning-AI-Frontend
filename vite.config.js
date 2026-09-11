import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // shadcn / Magic UI components are written against the "@/..." alias.
      // fileURLToPath (not URL.pathname) so a project path with spaces - this
      // one lives in "student portal" - isn't left percent-encoded.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
