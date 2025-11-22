import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    allowedHosts: true,   // allow any external host (ngrok)
    hmr: {
      clientPort: 443,     // required for HTTPS via ngrok
    }
  }
})

