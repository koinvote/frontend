import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import svgr from 'vite-plugin-svgr'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr(),
    // Support older Safari (e.g. iOS 14): transpile modern syntax and inject
    // polyfills for APIs the browser lacks (structuredClone, Array.at, etc.).
    legacy({
      targets: ['defaults', 'ios_saf >= 14'],
      modernPolyfills: true,
    }),
  ],
  // Ensure the modern bundle's syntax is also parseable by Safari 14.
  build: {
    target: ['es2020', 'safari14'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api/v1': {
        target: 'http://35.229.204.234:8080',
        changeOrigin: true,
      },
    },
  },
})