<!-- File Path: /client/src/views/TeacherAuthView.vue -->
<template>
    <div class="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {{ needsSetup ? '建立您的教師帳號' : '教師登入' }}
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          {{ needsSetup ? '這是您第一次啟動，請設定第一位管理者帳號。' : '智慧班級管理平台' }}
        </p>
      </div>
  
      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <!-- 註冊表單 -->
          <form v-if="needsSetup" class="space-y-6" @submit.prevent="handleRegister">
             <div>
              <label for="name" class="block text-sm font-medium text-gray-700">姓名</label>
              <div class="mt-1">
                <input v-model="form.name" id="name" type="text" required class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
              </div>
            </div>
            <div>
              <label for="username" class="block text-sm font-medium text-gray-700">帳號</label>
              <div class="mt-1">
                <input v-model="form.username" id="username" type="text" required class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
              </div>
            </div>
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">密碼</label>
              <div class="mt-1">
                <input v-model="form.password" id="password" type="password" required class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
              </div>
            </div>
            <!-- 新增：確認密碼欄位 -->
            <div>
              <label for="passwordConfirm" class="block text-sm font-medium text-gray-700">確認密碼</label>
              <div class="mt-1">
                <input v-model="form.passwordConfirm" id="passwordConfirm" type="password" required class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
              </div>
            </div>
            <div v-if="error" class="text-red-600 text-sm">{{ error }}</div>
            <div>
              <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                建立帳號
              </button>
            </div>
          </form>
  
          <!-- 登入表單 -->
          <form v-else class="space-y-6" @submit.prevent="handleLogin">
            <div>
              <label for="login-username" class="block text-sm font-medium text-gray-700">教師帳號</label>
              <div class="mt-1">
                <input v-model="form.username" id="login-username" type="text" required class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
              </div>
            </div>
            <div>
              <label for="login-password" class="block text-sm font-medium text-gray-700">密碼</label>
              <div class="mt-1">
                <input v-model="form.password" id="login-password" type="password" required class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
              </div>
            </div>
            <div v-if="error" class="text-red-600 text-sm">{{ error }}</div>
            <div>
              <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                登入
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, reactive } from 'vue';
  import { useRouter } from 'vue-router';
  
  const needsSetup = ref(false);
  const error = ref('');
  const router = useRouter();
  const form = reactive({
    name: '',
    username: '',
    password: '',
    passwordConfirm: '' // 新增 passwordConfirm
  });
  
  onMounted(async () => {
    try {
      const response = await fetch('/api/auth/teacher/setup-status');
      const data = await response.json();
      needsSetup.value = data.setupNeeded;
    } catch (err) {
      error.value = '無法連接到伺服器，請確認後端是否已啟動。';
    }
  });
  
  const handleRegister = async () => {
    error.value = '';
  
    // --- 新增：前端密碼驗證 ---
    if (form.password !== form.passwordConfirm) {
      error.value = '兩次輸入的密碼不一致，請重新確認。';
      return; // 中斷函式執行
    }
    if (form.password.length < 6) {
      error.value = '密碼長度至少需要 6 個字元。';
      return;
    }
  
    try {
      // 送到後端的資料不需要包含 passwordConfirm
      const payload = {
        name: form.name,
        username: form.username,
        password: form.password
      };
  
      const response = await fetch('/api/auth/teacher/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      alert('帳號建立成功！請使用剛剛建立的帳號密碼登入。');
      window.location.reload();
  
    } catch (err) {
      error.value = err.message;
    }
  };
  
  const handleLogin = async () => {
    error.value = '';
    try {
      const response = await fetch('/api/auth/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, password: form.password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      localStorage.setItem('teacherToken', data.token);
      localStorage.setItem('teacherInfo', JSON.stringify(data.teacher));
      
      window.location.href = '/';
  
    } catch (err) {
      error.value = err.message;
    }
  };
  </script>
  
  