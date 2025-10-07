<!-- File Path: /client/src/App.vue -->
<template>
  <div v-if="layout === 'default' && teacherIsAuthenticated" class="flex h-screen bg-gray-100 font-sans">
    <!-- Sidebar Navigation -->
    <aside class="w-64 bg-white shadow-lg flex flex-col">
      <div class="p-6 border-b">
        <h1 class="text-2xl font-bold text-sky-600">智慧班級</h1>
        <p class="text-sm text-gray-500 mt-1">歡迎，{{ teacherInfo.name }} 老師</p>
      </div>
      <nav class="flex-grow p-4 space-y-2">
        <router-link to="/" class="nav-link">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span>首頁</span>
        </router-link>
        <router-link to="/students" class="nav-link">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          <span>學生管理</span>
        </router-link>
        <router-link to="/seating-chart" class="nav-link">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"></path></svg>
          <span>座位表</span>
        </router-link>
        <router-link to="/dashboard" class="nav-link">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2a4 4 0 00-4-4H3V9h2a4 4 0 004-4V3l4 4-4 4zm11-1V9l-4-4 4-4v2a4 4 0 014 4h2v2h-2a4 4 0 01-4 4z"></path></svg>
          <span>課堂儀表板</span>
        </router-link>
        <router-link to="/assignments" class="nav-link">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5V3a2 2 0 012-2h2a2 2 0 012 2v2"></path></svg>
          <span>作業管理</span>
        </router-link>
        <router-link to="/grades" class="nav-link">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <span>成績管理</span>
        </router-link>
        <router-link to="/pingpong-teacher" class="nav-link">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>PingPong</span>
        </router-link>
      </nav>
      <div class="p-4 mt-auto">
        <button @click="logout" class="w-full flex items-center justify-center gap-2 p-3 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          <span>登出</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto p-8">
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
  localStorage.removeItem('teacherToken');
  localStorage.removeItem('teacherInfo');
  checkAuth();
  router.push({ name: 'auth' });
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
  @apply flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-sky-50 hover:text-sky-600 transition-colors;
}
.router-link-exact-active {
  @apply bg-sky-100 text-sky-700 font-semibold;
}
</style>

