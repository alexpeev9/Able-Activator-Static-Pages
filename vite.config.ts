import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { pageRoutes } from './vite/page-routes.ts'

export default defineConfig({
  plugins: [react(), pageRoutes()],
})
