// File Path: /client/vite.config.js
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      // 原有的 API 代理規則
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // 新增：照片路徑的代理規則
      '/photos': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
