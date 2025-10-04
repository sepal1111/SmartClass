<!-- /src/views/Login.vue -->
<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
      <h2 class="text-2xl font-bold text-center text-gray-900">登入系統</h2>
      <form class="space-y-6" @submit.prevent="handleLogin">
        <div>
          <label for="email" class="text-sm font-medium text-gray-700">電子郵件</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label for="password" class="text-sm font-medium text-gray-700">密碼</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div class="flex items-center justify-between">
          <router-link to="/reset-password" class="text-sm text-indigo-600 hover:underline">
            忘記密碼？
          </router-link>
        </div>
        <div>
          <button
            type="submit"
            class="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            登入
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
// 之後會引入 Pinia store
// import { useAuthStore } from '@/store/auth';

const email = ref('');
const password = ref('');
const router = useRouter();
// const authStore = useAuthStore();

const handleLogin = async () => {
  console.log('嘗試登入:', email.value);
  // 之後會使用 Pinia store 的 action
  // const success = await authStore.login(email.value, password.value);
  // if (success) {
  //   router.push('/');
  // } else {
  //   alert('登入失敗，請檢查您的帳號或密碼。');
  // }
  
  // 暫時直接跳轉
  router.push('/');
};
</script>

