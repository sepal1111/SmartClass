<!-- File Path: /client/src/views/AuthView.vue -->
<template>
  <div class="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-4xl font-extrabold text-sky-600">
        智慧班級
      </h2>
      <p class="mt-2 text-center text-lg text-slate-500">一個為課堂而生的互動平台</p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
      <div class="bg-white py-8 px-4 shadow-2xl rounded-2xl sm:px-10">
        
        <div v-if="!needsSetup" class="mb-6">
            <div class="flex border-b border-slate-200">
                <button @click="authMode = 'teacher'" :class="['w-1/2 py-4 text-center font-semibold text-lg transition-colors duration-200', authMode === 'teacher' ? 'border-b-4 border-sky-500 text-sky-600' : 'text-slate-500 hover:text-slate-800']">
                    教師登入
                </button>
                <button @click="authMode = 'student'" :class="['w-1/2 py-4 text-center font-semibold text-lg transition-colors duration-200', authMode === 'student' ? 'border-b-4 border-sky-500 text-sky-600' : 'text-slate-500 hover:text-slate-800']">
                    學生登入
                </button>
            </div>
        </div>

        <form v-if="needsSetup && authMode === 'teacher'" class="space-y-6" @submit.prevent="handleRegister">
          <h3 class="text-xl font-medium text-center text-slate-800">建立您的教師帳號</h3>
          <p class="text-center text-base text-slate-600">這是您第一次啟動，請設定第一位管理者帳號。</p>
           <div>
            <label for="name" class="block text-base font-medium text-slate-700">姓名</label>
            <input v-model="form.name" id="name" type="text" required placeholder="請輸入您的姓名" class="form-input mt-1 text-lg py-3">
          </div>
          <div>
            <label for="username" class="block text-base font-medium text-slate-700">帳號</label>
            <input v-model="form.username" id="username" type="text" required placeholder="設定您的登入帳號" class="form-input mt-1 text-lg py-3">
          </div>
          <div>
            <label for="password" class="block text-base font-medium text-slate-700">密碼</label>
            <input v-model="form.password" id="password" type="password" required placeholder="至少 6 個字元" class="form-input mt-1 text-lg py-3">
          </div>
          <div>
            <label for="passwordConfirm" class="block text-base font-medium text-slate-700">確認密碼</label>
            <input v-model="form.passwordConfirm" id="passwordConfirm" type="password" required placeholder="再次輸入您的密碼" class="form-input mt-1 text-lg py-3">
          </div>
          <div v-if="error" class="text-red-500 text-base text-center font-semibold">{{ error }}</div>
          <div>
            <button type="submit" class="w-full btn btn-success text-xl py-4">建立帳號</button>
          </div>
        </form>

        <form v-else class="space-y-6" @submit.prevent="handleLogin">
          <div v-if="authMode === 'teacher'">
              <div>
                <label for="login-username" class="block text-base font-medium text-slate-700">教師帳號</label>
                <input v-model="form.username" id="login-username" type="text" required class="form-input mt-1 text-lg py-3">
              </div>
              <div class="mt-4">
                <label for="login-password" class="block text-base font-medium text-slate-700">密碼</label>
                <input v-model="form.password" id="login-password" type="password" required class="form-input mt-1 text-lg py-3">
              </div>
          </div>
          <div v-if="authMode === 'student'">
              <div>
                <label for="student-account" class="block text-base font-medium text-slate-700">學生帳號</label>
                <input v-model="form.account" id="student-account" type="text" required class="form-input mt-1 text-lg py-3">
              </div>
              <div class="mt-4">
                <label for="student-password" class="block text-base font-medium text-slate-700">密碼</label>
                <input v-model="form.password" id="student-password" type="password" required class="form-input mt-1 text-lg py-3">
              </div>
          </div>
          <div v-if="error" class="text-red-500 text-base text-center font-semibold">{{ error }}</div>
          <div>
            <button type="submit" class="w-full btn btn-primary text-xl py-4">登入</button>
          </div>
        </form>

        <div v-if="!needsSetup" class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-300"></div></div>
            <div class="relative flex justify-center text-sm"><span class="px-2 bg-white text-slate-500 text-base">或者</span></div>
          </div>
          <div class="mt-6">
            <button @click="goToPingPong" class="w-full btn bg-teal-500 hover:bg-teal-600 text-xl py-4">加入 即時問答 活動</button>
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

const form = reactive({ name: '', username: '', account: '', password: '', passwordConfirm: '' });

watch(authMode, () => { error.value = ''; Object.keys(form).forEach(key => form[key] = ''); });

const checkSetupStatus = async () => {
  try {
    const response = await fetch('/api/auth/teacher/setup-status');
    const data = await response.json();
    needsSetup.value = data.setupNeeded;
  } catch (err) { error.value = '無法連接到伺服器，請確認後端是否已啟動。'; }
};

onMounted(checkSetupStatus);

const handleRegister = async () => {
  error.value = '';
  if (form.password !== form.passwordConfirm) return error.value = '兩次輸入的密碼不一致。';
  if (form.password.length < 6) return error.value = '密碼長度至少需要 6 個字元。';
  try {
    const response = await fetch('/api/auth/teacher/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, username: form.username, password: form.password })
    });
    if (!response.ok) throw new Error((await response.json()).error);
    alert('帳號建立成功！請使用剛剛建立的帳號密碼登入。');
    window.location.reload();
  } catch (err) { error.value = err.message; }
};

const handleLogin = async () => {
  error.value = '';
  const isTeacherLogin = authMode.value === 'teacher';
  const url = isTeacherLogin ? '/api/auth/teacher/login' : '/api/auth/student/login';
  const body = isTeacherLogin 
    ? { username: form.username, password: form.password } 
    : { account: form.account, password: form.password };

  try {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    
    // *** 修正開始：登入後強制頁面重載 ***
    if (isTeacherLogin) {
      localStorage.setItem('teacherToken', data.token);
      localStorage.setItem('teacherInfo', JSON.stringify(data.teacher));
      // 使用 window.location.href 強制瀏覽器完整重新載入，確保 App.vue 重新初始化
      window.location.href = '/'; 
    } else {
      localStorage.setItem('studentToken', data.token);
      localStorage.setItem('studentInfo', JSON.stringify(data.student));
      // 同上，導向學生儀表板並重載
      window.location.href = '/student/dashboard'; 
    }
    // *** 修正結束 ***
  } catch (err) { error.value = err.message; }
};

const goToPingPong = () => router.push({ name: 'pingpong-student' });
</script>

