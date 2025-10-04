<!-- /src/components/layout/Navbar.vue -->
<template>
  <header class="bg-white shadow-md p-4 flex justify-between items-center">
    <h1 class="text-xl font-semibold text-gray-700">智慧班級管理平台</h1>
    <div>
      <span class="text-gray-600 mr-4">歡迎，王老師</span>
      <button @click="logout" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300">
        登出
      </button>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router';
// 之後會在這裡引入 Pinia 的 auth store 來處理登出邏輯
// import { useAuthStore } from '@/store/auth';

const router = useRouter();
// const authStore = useAuthStore();

const logout = () => {
  console.log('執行登出...');
  // 之後會取消註解
  // authStore.logout();
  router.push('/login');
};
</script>

