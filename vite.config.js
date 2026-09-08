import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // shadcn components are written against the "@/..." alias.
      '@': path.resolve(new URL('./src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')),
    },
  },
})
