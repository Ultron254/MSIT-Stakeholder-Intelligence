import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            { name: 'react-vendor', test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'charts', test: /[\\/]node_modules[\\/]recharts[\\/]/ },
            { name: 'icons', test: /[\\/]node_modules[\\/]lucide-react[\\/]/ },
            { name: 'state', test: /[\\/]node_modules[\\/]zustand[\\/]/ },
            { name: 'date', test: /[\\/]node_modules[\\/]date-fns[\\/]/ },
          ],
        },
      },
    },
  },
})
