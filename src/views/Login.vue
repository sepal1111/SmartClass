<!-- /src/views/Login.vue -->
<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-10rem)]">
    <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
      
      <div v-if="mode === 'login'">
        <h2 class="text-2xl font-bold text-center text-gray-800">登入系統</h2>
        <form @submit.prevent="handleLogin" class="mt-8 space-y-6">
          <div>
            <label for="login-email" class="text-sm font-medium text-gray-700">電子郵件</label>
            <input v-model="email" id="login-email" type="email" required class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="your@email.com">
          </div>
          <div>
            <label for="login-password" class="text-sm font-medium text-gray-700">密碼</label>
            <input v-model="password" id="login-password" type="password" required class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="••••••••">
          </div>
          <button type="submit" class="w-full py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">登入</button>
        </form>
      </div>

      <div v-if="mode === 'register'">
        <h2 class="text-2xl font-bold text-center text-gray-800">建立管理者帳號</h2>
        <form @submit.prevent="handleRegister" class="mt-8 space-y-6">
           <div>
            <label for="register-name" class="text-sm font-medium text-gray-700">姓名</label>
            <input v-model="name" id="register-name" type="text" required class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="王大明">
          </div>
          <div>
            <label for="register-email" class="text-sm font-medium text-gray-700">電子郵件</label>
            <input v-model="email" id="register-email" type="email" required class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="your@email.com">
          </div>
          <div>
            <label for="register-password" class="text-sm font-medium text-gray-700">密碼</label>
            <input v-model="password" id="register-password" type="password" required class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="至少8個字元">
          </div>
          <div>
            <label for="register-password-confirm" class="text-sm font-medium text-gray-700">確認密碼</label>
            <input v-model="passwordConfirm" id="register-password-confirm" type="password" required class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="請再次輸入密碼">
          </div>
          <button type="submit" class="w-full py-2 text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">建立帳號</button>
        </form>
      </div>

      <div v-if="mode === 'forgotPassword'">
        <h2 class="text-2xl font-bold text-center text-gray-800">重設密碼</h2>
        <p class="mt-2 text-sm text-center text-gray-600">請輸入您的電子郵件，我們將會寄送密碼重設連結給您。</p>
        <form @submit.prevent="handleForgotPassword" class="mt-8 space-y-6">
          <div>
            <label for="forgot-email" class="text-sm font-medium text-gray-700">電子郵件</label>
            <input v-model="email" id="forgot-email" type="email" required class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="your@email.com">
          </div>
          <button type="submit" class="w-full py-2 text-white bg-orange-500 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">傳送重設連結</button>
        </form>
      </div>
      
      <div v-if="errorMessage" class="p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="p-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
        {{ successMessage }}
      </div>

      <div class="text-sm text-center">
        <a v-if="mode === 'login'" @click.prevent="switchMode('register')" href="#" class="font-medium text-indigo-600 hover:text-indigo-500">還沒有帳號？建立一個管理者帳號</a>
        <a v-if="mode === 'login'" @click.prevent="switchMode('forgotPassword')" href="#" class="block mt-2 font-medium text-gray-600 hover:text-gray-500">忘記密碼？</a>
        <a v-if="mode === 'register' || mode === 'forgotPassword'" @click.prevent="switchMode('login')" href="#" class="font-medium text-indigo-600 hover:text-indigo-500">返回登入</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../store/auth';
import { account } from '../services/appwrite';
import { ID } from 'appwrite';

const { login } = useAuth();
const router = useRouter();

const mode = ref('login');
const email = ref('');
const password = ref('');
const passwordConfirm = ref(''); // 新增確認密碼的 ref
const name = ref('');
const errorMessage = ref('');
const successMessage = ref('');

const clearMessages = () => {
  errorMessage.value = '';
  successMessage.value = '';
};

const switchMode = (newMode) => {
  mode.value = newMode;
  clearMessages();
  email.value = '';
  password.value = '';
  passwordConfirm.value = ''; // 切換模式時也清空
  name.value = '';
};

const handleLogin = async () => {
  clearMessages();
  const success = await login(email.value, password.value);
  if (success) {
    router.push({ name: 'Dashboard' });
  } else {
    errorMessage.value = '登入失敗，請檢查您的帳號或密碼。';
  }
};

const handleRegister = async () => {
  clearMessages();
  if (password.value !== passwordConfirm.value) {
    errorMessage.value = '兩次輸入的密碼不一致，請重新確認。';
    return;
  }
  if (password.value.length < 8) {
    errorMessage.value = '密碼長度至少需要8個字元。';
    return;
  }
  try {
    await account.create(ID.unique(), email.value, password.value, name.value);
    successMessage.value = '帳號建立成功！您現在可以返回登入頁面進行登入。';
    mode.value = 'login';
  } catch (error) {
    errorMessage.value = `註冊失敗: ${error.message}`;
  }
};

const handleForgotPassword = async () => {
  clearMessages();
  try {
    const resetUrl = `${window.location.origin}/reset-password`;
    await account.createRecovery(email.value, resetUrl);
    successMessage.value = '密碼重設郵件已寄出，請檢查您的信箱。';
  } catch (error) {
    errorMessage.value = `操作失敗: ${error.message}`;
  }
};
</script>

