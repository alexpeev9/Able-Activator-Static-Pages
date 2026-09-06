import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { landingRoutes } from './src/landings/pipeline/vite-plugin.ts'

export default defineConfig({
  plugins: [react(), landingRoutes()],
})
