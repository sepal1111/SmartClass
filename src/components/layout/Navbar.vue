<!-- /src/components/layout/Navbar.vue -->
<template>
  <header class="bg-white shadow-sm p-4 flex justify-between items-center">
    <h2 class="text-xl font-semibold text-gray-700">{{ currentRouteName }}</h2>
    <div>
      <span class="text-gray-600 mr-4">教師您好！</span>
      <button @click="logout" class="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
        登出
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { account } from '../../services/appwrite';

const route = useRoute();
const router = useRouter();

const currentRouteName = computed(() => {
  // 這裡可以做一個路由名稱到中文的映射
  return route.name || '儀表板';
});

const logout = async () => {
  try {
    await account.deleteSession('current');
    router.push('/login');
  } catch (e) {
    console.error('登出失敗:', e);
  }
};
</script>
