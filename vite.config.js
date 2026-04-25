import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
   
      '/duffel': {
        target: 'https://api.duffel.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/duffel/, ''),
      },
    },
  },
})