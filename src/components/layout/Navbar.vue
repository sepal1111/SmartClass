<!-- /src/components/layout/Navbar.vue -->
<template>
  <header class="h-16 bg-white shadow-md flex items-center justify-between px-6">
    <div>
      <h1 v-if="user" class="text-xl font-semibold">歡迎回來, {{ user.name }}！</h1>
    </div>
    <div>
      <!-- **重要修正**: 直接呼叫從 store 取得的 logout 函式 -->
      <button @click="logout" class="text-gray-600 hover:text-gray-800">登出</button>
    </div>
  </header>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useAuth } from '../../store/auth';

const authStore = useAuth();
// 使用 storeToRefs 確保 user 保持響應性
const { user } = storeToRefs(authStore);
// 直接從 store 解構 logout 函式
const { logout } = authStore;

// 已不再需要 handleLogout 和 useRouter
</script>

