<!-- File Path: /client/src/App.vue -->
<template>
  <div v-if="layout === 'default' && teacherIsAuthenticated" class="flex h-screen bg-slate-50 font-sans">
    <!-- Sidebar Navigation -->
    <aside class="w-60 bg-white border-r border-slate-200 flex flex-col">
      <div class="p-6 border-b border-slate-200">
        <h1 class="text-3xl font-bold text-sky-600">智慧班級</h1>
        <p class="text-base text-slate-500 mt-2">歡迎，{{ teacherInfo.name }} 老師</p>
      </div>
      <nav class="flex-grow p-4 space-y-2">
        <!-- Reordered nav items for better workflow -->
        <router-link to="/dashboard" class="nav-link">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2a4 4 0 00-4-4H3V9h2a4 4 0 004-4V3l4 4-4 4zm11-1V9l-4-4 4-4v2a4 4 0 014 4h2v2h-2a4 4 0 01-4 4z"></path></svg>
          <span class="text-lg">課堂儀表板</span>
        </router-link>
        <router-link to="/seating-chart" class="nav-link">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"></path></svg>
          <span class="text-lg">座位表</span>
        </router-link>
        <router-link to="/students" class="nav-link">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          <span class="text-lg">學生管理</span>
        </router-link>
        <router-link to="/grades" class="nav-link">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <span class="text-lg">成績管理</span>
        </router-link>
        <router-link to="/assignments" class="nav-link">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5V3a2 2 0 012-2h2a2 2 0 012 2v2"></path></svg>
          <span class="text-lg">作業管理</span>
        </router-link>
        <router-link to="/pingpong-teacher" class="nav-link">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span class="text-lg">PingPong</span>
        </router-link>
         <router-link to="/quiz" class="nav-link">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
          </svg>
          <span class="text-lg">搶答競賽</span>
        </router-link>
        <router-link to="/" class="nav-link">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span class="text-lg">首頁</span>
        </router-link>
      </nav>
      <div class="p-6 mt-auto">
        <button @click="logout" class="w-full flex items-center justify-center gap-3 p-4 rounded-xl text-red-600 bg-red-100 hover:bg-red-200 transition-colors font-semibold text-lg">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          <span>登出</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto p-10">
      <router-view />
    </main>
  </div>

  <!-- Clean Layout (for login, student pages, etc.) -->
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
  localStorage.clear(); // 清除所有本地存儲資料，確保完全登出
  checkAuth();
  // 強制重新載入頁面到登入頁，確保所有狀態被重置
  window.location.href = '/auth';
};

const handleStorageChange = (event) => {
  if (event.key === 'teacherToken' || event.key === 'teacherInfo') {
    checkAuth();
  }
};

onMounted(() => {
  checkAuth();
  window.addEventListener('storage', handleStorageChange);
  router.afterEach(() => {
    checkAuth();
  });
});

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange);
});
</script>

<style scoped>
.nav-link {
  @apply flex items-center gap-4 px-6 py-3 rounded-xl text-slate-600 hover:bg-sky-100 hover:text-sky-700 transition-colors relative;
}
.router-link-exact-active {
  @apply bg-sky-100 text-sky-700 font-semibold;
}
.router-link-exact-active::before {
  content: '';
  @apply absolute left-0 top-2 bottom-2 w-1.5 bg-sky-500 rounded-r-full;
}
</style>

