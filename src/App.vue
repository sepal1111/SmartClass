<!-- /src/App.vue -->
<template>
  <div class="flex h-screen bg-gray-100 font-sans">
    <!-- Sidebar: 僅在非登入頁面顯示 -->
    <Sidebar v-if="shouldShowLayout" />

    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Navbar: 僅在非登入頁面顯示 -->
      <Navbar v-if="shouldShowLayout" />

      <!-- 主要內容區域 -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
        <div class="container mx-auto px-6 py-8">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Navbar from './components/layout/Navbar.vue';
import Sidebar from './components/layout/Sidebar.vue';

const route = useRoute();

// 判斷是否應該顯示 Sidebar 和 Navbar
// 在登入和重設密碼頁面時，我們不希望顯示主佈局
const shouldShowLayout = computed(() => {
  return route.name !== 'Login' && route.name !== 'ResetPassword';
});
</script>

<style>
/* 可以在這裡添加一些全域的 App 樣式 */
</style>

