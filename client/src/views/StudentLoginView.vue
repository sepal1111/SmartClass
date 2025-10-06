<!-- File Path: /client/src/views/StudentLoginView.vue -->
<template>
    <div class="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          學生登入
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          繳交數位作品
        </p>
      </div>
  
      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form class="space-y-6" @submit.prevent="handleLogin">
            <div>
              <label for="account" class="block text-sm font-medium text-gray-700">
                帳號
              </label>
              <div class="mt-1">
                <input v-model="account" id="account" name="account" type="text" required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
            </div>
  
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">
                密碼
              </label>
              <div class="mt-1">
                <input v-model="password" id="password" name="password" type="password" required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
            </div>
            
            <div v-if="error" class="text-red-600 text-sm">
              {{ error }}
            </div>
  
            <div>
              <button type="submit"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                登入
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  
  const account = ref('');
  const password = ref('');
  const error = ref('');
  const router = useRouter();
  
  const handleLogin = async () => {
    error.value = '';
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: account.value, password: password.value })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '登入失敗');
      }
      
      // 登入成功，儲存 token 和學生資訊
      localStorage.setItem('studentToken', data.token);
      localStorage.setItem('studentInfo', JSON.stringify(data.student));
      
      // 導向學生儀表板
      router.push({ name: 'student-dashboard' });
  
    } catch (err) {
      error.value = err.message;
    }
  };
  </script>
  