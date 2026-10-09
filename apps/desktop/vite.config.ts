import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

import { electrobunViteAliases } from './.hutch/devkit/api/config/electrobun-vite'

const config = defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: /^~\//u,
        replacement: `${path.resolve(import.meta.dirname, 'src/mainview')}/`,
      },
      ...electrobunViteAliases(
        path.resolve(import.meta.dirname, '.hutch/devkit')
      ),
    ],
    dedupe: ['react', 'react-dom'],
  },
  root: './src/mainview',
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  legacy: { inconsistentCjsInterop: true },
})

export default config
