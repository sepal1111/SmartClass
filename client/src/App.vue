<!-- File Path: /client/src/App.vue -->
<template>
  <!-- 增加一個載入畫面，用於在驗證 token 時顯示，防止畫面閃爍 -->
  <div v-if="isVerifyingAuth" class="h-screen w-screen flex flex-col items-center justify-center bg-slate-100 text-slate-600">
      <svg class="animate-spin h-12 w-12 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="mt-4 text-lg font-medium">正在驗證您的身分...</p>
  </div>

  <div v-else-if="layout === 'default' && teacherIsAuthenticated" class="flex h-screen bg-slate-50 font-sans">
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
import { authFetch } from '@/utils/api';

const route = useRoute();
const router = useRouter();

const teacherIsAuthenticated = ref(false);
const teacherInfo = ref({});
const studentIsAuthenticated = ref(false);
const studentInfo = ref({});
const isVerifyingAuth = ref(true);

// ** 全面重構的 checkAuth 函式 **
const checkAuth = async () => {
  isVerifyingAuth.value = true;
  const teacherToken = localStorage.getItem('teacherToken');
  const studentToken = localStorage.getItem('studentToken');
  
  // 優先驗證教師 Token
  if (teacherToken) {
    try {
      // *** 修正：在 URL 加上時間戳記以強制請求，徹底避免瀏覽器快取 ***
      const response = await authFetch(`/api/auth/teacher/verify?_=${new Date().getTime()}`);
      if (response.ok) {
        const data = await response.json();
        teacherIsAuthenticated.value = true;
        teacherInfo.value = data.teacher;
        localStorage.setItem('teacherInfo', JSON.stringify(data.teacher));
      } else {
        throw new Error('Teacher token invalid');
      }
    } catch (error) {
      console.error("驗證教師失敗:", error);
      clearAuthData();
    }
  // 如果沒有教師 Token，再驗證學生 Token
  } else if (studentToken) {
    try {
      // *** 修正：在 URL 加上時間戳記以強制請求，徹底避免瀏覽器快取 ***
      const response = await authFetch(`/api/auth/student/verify?_=${new Date().getTime()}`);
       if (response.ok) {
        const data = await response.json();
        studentIsAuthenticated.value = true;
        studentInfo.value = data.student;
        localStorage.setItem('studentInfo', JSON.stringify(data.student));
      } else {
        throw new Error('Student token invalid');
      }
    } catch (error) {
      console.error("驗證學生失敗:", error);
      clearAuthData();
    }
  // 如果都沒有 Token，就清理狀態
  } else {
    clearAuthData();
  }

  isVerifyingAuth.value = false;
};

// ** 統一的登出/清理函式 **
const clearAuthData = () => {
    localStorage.removeItem('teacherToken');
    localStorage.removeItem('teacherInfo');
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentInfo');
    teacherIsAuthenticated.value = false;
    teacherInfo.value = {};
    studentIsAuthenticated.value = false;
    studentInfo.value = {};
};

const layout = computed(() => {
    // 即使學生已登入，儀表板也應使用乾淨佈局
    if (studentIsAuthenticated.value && route.name !== 'home' && route.name !== 'auth') {
        return 'clean';
    }
    return route.meta.layout || 'default';
});

const logout = () => {
  clearAuthData();
  // 使用重載導向到登入頁，確保狀態完全重置
  window.location.href = '/auth';
};

onMounted(() => {
  checkAuth();
  // 監聽 storage 變化，以同步不同分頁的登入狀態
  window.addEventListener('storage', checkAuth);
});

onUnmounted(() => {
  window.removeEventListener('storage', checkAuth);
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

