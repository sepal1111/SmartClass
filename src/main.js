// /src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/styles/main.css'

// 初始化 Firebase (確保在應用程式啟動時只執行一次)
import { initializeApp } from './services/firebase';
initializeApp();

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

