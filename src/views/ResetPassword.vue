<!-- /src/views/ResetPassword.vue -->
<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
      <h2 class="text-2xl font-bold text-center text-gray-900">重設密碼</h2>
      <p class="text-center text-gray-600">請輸入您的電子郵件地址，我們將會寄送重設密碼的連結給您。</p>
      <form class="space-y-6" @submit.prevent>
        <div>
          <label for="email" class="text-sm font-medium text-gray-700">電子郵件</label>
          <input
            id="email"
            type="email"
            required
            class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <button
            type="submit"
            class="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            發送重設連結
          </button>
        </div>
         <div class="text-center">
            <router-link to="/login" class="text-sm text-indigo-600 hover:underline">
            返回登入
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

