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
      // 將所有 /api 開頭的請求代理到後端伺-服器
      '/api': {
        target: 'http://127.0.0.1:3000', // 使用 127.0.0.1 避免 IPv6 問題
        changeOrigin: true, // 允許跨域
        // 如果您的後端 API 路徑本身不包含 /api，可以使用 rewrite
        // 例如：前端請求 /api/users，實際代理到 http://127.0.0.1:3000/users
        // rewrite: (path) => path.replace(/^\/api/, '') 
      },
      '/photos': {
        target: 'http://127.0.0.1:3000', // 後端伺服器位址
        changeOrigin: true,              // 允許跨域
      },
      '/uploads': {
        target: 'http://127.0.0.1:3000', // 後端伺服器位址
        changeOrigin: true,              // 允許跨域
      }
    }
  }
})