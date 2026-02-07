import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), UnoCSS()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@homepage': path.resolve(__dirname, './src/homepage'),
      '@frontend': path.resolve(__dirname, './src/frontend'),
      '@backstage': path.resolve(__dirname, './src/backstage'),
      '@common': path.resolve(__dirname, './src/common')
    }
  }
})
