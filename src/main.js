// /src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'

const app = createApp(App)
const pinia = createPinia() // 1. 建立 Pinia 實例

app.use(pinia)  // 2. **優先**安裝 Pinia，讓狀態管理系統準備就緒
app.use(router) // 3. 再安裝 Router，此時 Router 才能安全地使用狀態管理

app.mount('#app')

