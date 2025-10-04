<!-- /src/App.vue -->
<template>
  <!-- 在初始狀態檢查完成前，顯示全螢幕的載入中畫面 -->
  <div v-if="isLoading" class="flex h-screen w-full items-center justify-center bg-gray-100">
    <div class="text-2xl font-semibold text-gray-600">
      載入中...
    </div>
  </div>

  <!-- 載入完成後，再根據登入狀態顯示對應的內容 -->
  <div v-else class="flex h-screen bg-gray-100">
    <!-- 只有在登入狀態下才顯示側邊欄 -->
    <Sidebar v-if="isLoggedIn" />

    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 只有在登入狀態下才顯示頂部導覽列 -->
      <Navbar v-if="isLoggedIn" />

      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
        <div class="container mx-auto px-6 py-8">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import Sidebar from './components/layout/Sidebar.vue';
import Navbar from './components/layout/Navbar.vue';
import { useAuth } from './store/auth';

const authStore = useAuth();
// 使用 storeToRefs 確保 isLoggedIn 和 isLoading 保持響應性
const { isLoggedIn, isLoading } = storeToRefs(authStore);
const { checkAuthStatus } = authStore;

// 當 App.vue 組件掛載完成時，立即執行一次認證狀態檢查
onMounted(() => {
  checkAuthStatus();
});
</script>

