<!-- File Path: /client/src/App.vue -->
<template>
  <div v-if="layout === 'default' && teacherIsAuthenticated" class="min-h-screen bg-gray-100 font-sans">
    <header class="bg-white shadow-md">
      <nav class="container mx-auto px-6 py-3">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-xl font-bold text-gray-800">智慧班級管理平台</h1>
            <p class="text-sm text-gray-500">歡迎，{{ teacherInfo.name }} 老師</p>
          </div>
          <div class="flex items-center">
            <router-link to="/" class="mx-2 text-gray-600 hover:text-blue-500">首頁</router-link>
            <router-link to="/students" class="mx-2 text-gray-600 hover:text-blue-500">學生管理</router-link>
            <router-link to="/seating-chart" class="mx-2 text-gray-600 hover:text-blue-500">座位表</router-link>
            <router-link to="/dashboard" class="mx-2 text-gray-600 hover:text-blue-500">課堂儀表板</router-link>
            <router-link to="/assignments" class="mx-2 text-gray-600 hover:text-blue-500">作業管理</router-link>
            <router-link to="/grades" class="mx-2 text-gray-600 hover:text-blue-500">成績管理</router-link>
            <router-link to="/pingpong-teacher" class="mx-2 text-gray-600 hover:text-blue-500">PingPong</router-link>
            <button @click="logout" class="ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm">登出</button>
          </div>
        </div>
      </nav>
    </header>
    <main class="container mx-auto px-6 py-8">
      <router-view />
    </main>
  </div>
  <div v-else>
      <router-view />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const teacherIsAuthenticated = ref(false);
const teacherInfo = ref({});

const checkAuth = () => {
  const token = localStorage.getItem('teacherToken');
  const info = localStorage.getItem('teacherInfo');
  teacherIsAuthenticated.value = !!token;
  teacherInfo.value = info ? JSON.parse(info) : {};
};

const layout = computed(() => route.meta.layout || 'default');

const logout = () => {
  localStorage.removeItem('teacherToken');
  localStorage.removeItem('teacherInfo');
  checkAuth();
  router.push({ name: 'auth' });
};

// 監聽 storage 事件，以便在多個分頁中同步登出狀態
const handleStorageChange = (event) => {
  if (event.key === 'teacherToken' || event.key === 'teacherInfo') {
    checkAuth();
  }
};

onMounted(() => {
  checkAuth();
  window.addEventListener('storage', handleStorageChange);
   // 監聽路由變化，確保每次導航都重新檢查認證狀態
  router.afterEach(() => {
    checkAuth();
  });
});

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange);
});
</script>

