import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue(), UnoCSS()],
  optimizeDeps: {
    include: [
      'prismjs',
      'prismjs/components/prism-clike',
      'prismjs/components/prism-javascript'
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(currentDir, './src'),
      '@homepage': path.resolve(currentDir, './src/homepage'),
      '@frontend': path.resolve(currentDir, './src/frontend'),
      '@backstage': path.resolve(currentDir, './src/backstage'),
      '@common': path.resolve(currentDir, './src/common')
    }
  }
})
