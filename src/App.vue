<!-- /src/App.vue -->
<template>
  <div class="flex h-screen bg-gray-100 text-gray-800">
    <Sidebar v-if="shouldShowLayout" />
    <div class="flex-1 flex flex-col overflow-hidden">
      <Navbar v-if="shouldShowLayout" />
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from './components/layout/Sidebar.vue';
import Navbar from './components/layout/Navbar.vue';

const route = useRoute();
// 在登入頁面不顯示 Sidebar 和 Navbar
const shouldShowLayout = computed(() => route.meta.layout !== 'auth');
</script>
