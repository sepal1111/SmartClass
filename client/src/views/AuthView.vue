<!-- File Path: /client/src/views/AuthView.vue -->
<template>
  <div class="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        智慧班級管理平台
      </h2>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        
        <!-- 身份切換 -->
        <div class="mb-6">
            <div class="flex border-b border-gray-200">
                <button @click="authMode = 'teacher'" :class="['w-1/2 py-4 text-center font-medium text-sm', authMode === 'teacher' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700']">
                    教師登入
                </button>
                <button @click="authMode = 'student'" :class="['w-1/2 py-4 text-center font-medium text-sm', authMode === 'student' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700']">
                    學生登入
                </button>
            </div>
        </div>

        <!-- 註冊表單 (僅在需要設定時顯示) -->
        <form v-if="needsSetup && authMode === 'teacher'" class="space-y-6" @submit.prevent="handleRegister">
          <h3 class="text-lg font-medium text-center text-gray-800">建立您的教師帳號</h3>
          <p class="text-center text-sm text-gray-600">這是您第一次啟動，請設定第一位管理者帳號。</p>
           <div>
            <label for="name" class="block text-sm font-medium text-gray-700">姓名</label>
            <input v-model="form.name" id="name" type="text" required placeholder="請輸入您的姓名"
              class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          </div>
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700">帳號</label>
            <input v-model="form.username" id="username" type="text" required placeholder="設定您的登入帳號"
              class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">密碼</label>
            <input v-model="form.password" id="password" type="password" required placeholder="至少 6 個字元"
              class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          </div>
          <div>
            <label for="passwordConfirm" class="block text-sm font-medium text-gray-700">確認密碼</label>
            <input v-model="form.passwordConfirm" id="passwordConfirm" type="password" required placeholder="再次輸入您的密碼"
              class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
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
           <!-- 教師登入 -->
          <div v-if="authMode === 'teacher'">
              <div>
                <label for="login-username" class="block text-sm font-medium text-gray-700">教師帳號</label>
                <input v-model="form.username" id="login-username" type="text" required
                  class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              </div>
              <div class="mt-4">
                <label for="login-password" class="block text-sm font-medium text-gray-700">密碼</label>
                <input v-model="form.password" id="login-password" type="password" required
                  class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              </div>
          </div>
           <!-- 學生登入 -->
          <div v-if="authMode === 'student'">
              <div>
                <label for="student-account" class="block text-sm font-medium text-gray-700">學生帳號</label>
                <input v-model="form.account" id="student-account" type="text" required
                  class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              </div>
              <div class="mt-4">
                <label for="student-password" class="block text-sm font-medium text-gray-700">密碼</label>
                <input v-model="form.password" id="student-password" type="password" required
                  class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              </div>
          </div>
          <div v-if="error" class="text-red-600 text-sm">{{ error }}</div>
          <div>
            <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
              登入
            </button>
          </div>
        </form>

        <!-- 分隔線與 PingPong 入口 -->
        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">或者</span>
            </div>
          </div>
          <div class="mt-6">
            <button @click="goToPingPong" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700">
              加入 PingPong 活動
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';

const needsSetup = ref(false);
const error = ref('');
const router = useRouter();
const authMode = ref('teacher');

const form = reactive({
  name: '',
  username: '',
  account: '',
  password: '',
  passwordConfirm: ''
});

// 監聽 authMode 的變化，並清空表單
watch(authMode, () => {
    error.value = '';
    Object.keys(form).forEach(key => form[key] = '');
});

const checkSetupStatus = async () => {
  try {
    const response = await fetch('/api/auth/teacher/setup-status');
    const data = await response.json();
    needsSetup.value = data.setupNeeded;
  } catch (err) {
    error.value = '無法連接到伺服器，請確認後端是否已啟動。';
  }
};

onMounted(checkSetupStatus);

const handleRegister = async () => {
  error.value = '';
  if (form.password !== form.passwordConfirm) {
    return error.value = '兩次輸入的密碼不一致。';
  }
  if (form.password.length < 6) {
    return error.value = '密碼長度至少需要 6 個字元。';
  }
  try {
    const response = await fetch('/api/auth/teacher/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, username: form.username, password: form.password })
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
  const isTeacherLogin = authMode.value === 'teacher';
  const url = isTeacherLogin ? '/api/auth/teacher/login' : '/api/auth/student/login';
  const body = isTeacherLogin 
    ? { username: form.username, password: form.password } 
    : { account: form.account, password: form.password };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    
    if (isTeacherLogin) {
      localStorage.setItem('teacherToken', data.token);
      localStorage.setItem('teacherInfo', JSON.stringify(data.teacher));
      router.push({ name: 'home' });
    } else {
      localStorage.setItem('studentToken', data.token);
      localStorage.setItem('studentInfo', JSON.stringify(data.student));
      router.push({ name: 'student-dashboard' });
    }
  } catch (err) {
    error.value = err.message;
  }
};

const goToPingPong = () => {
  router.push({ name: 'pingpong-student' });
};
</script>

