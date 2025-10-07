<!-- File Path: /client/src/views/HomeView.vue -->
<template>
  <div>
    <div class="flex justify-between items-start mb-8">
        <div>
            <h1 class="text-4xl font-bold text-slate-800 mb-2">歡迎使用智慧班級系統</h1>
            <p class="text-lg text-slate-600">您可以從左側導覽列選擇功能，或透過下方快速入口開始。</p>
        </div>
        <button @click="showQrCode = true" class="btn btn-secondary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v1m6 11h2m-6.5 6.5v1M4.5 12.5h-1M12 20.5v-1m7.5-6.5h1M4 12V6a2 2 0 012-2h6v6h6v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-2m-2-4h2m18 0h2M12 7.5h6.5M7.5 12v6.5m7.5-11h2" />
            </svg>
            顯示連線 QR Code
        </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <!-- 快速入口 1: 課堂儀表板 -->
      <div class="card p-8 flex flex-col items-start hover:shadow-xl transition-shadow">
        <div class="bg-sky-100 p-4 rounded-xl mb-4">
          <svg class="w-10 h-10 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2a4 4 0 00-4-4H3V9h2a4 4 0 004-4V3l4 4-4 4zm11-1V9l-4-4 4-4v2a4 4 0 014 4h2v2h-2a4 4 0 01-4 4z"></path></svg>
        </div>
        <h2 class="text-2xl font-bold text-slate-800">課堂儀表板</h2>
        <p class="text-base text-slate-600 mt-2 flex-grow">即時掌握學生出缺席、課堂表現，並進行隨機抽籤。</p>
        <router-link to="/dashboard" class="btn btn-primary mt-6 w-full text-center">前往儀表板</router-link>
      </div>

      <!-- 快速入口 2: 學生管理 -->
      <div class="card p-8 flex flex-col items-start hover:shadow-xl transition-shadow">
        <div class="bg-teal-100 p-4 rounded-xl mb-4">
          <svg class="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
        </div>
        <h2 class="text-2xl font-bold text-slate-800">學生管理</h2>
        <p class="text-base text-slate-600 mt-2 flex-grow">管理班級學生名單、帳號、密碼，並支援批次匯入。</p>
        <router-link to="/students" class="btn bg-teal-500 hover:bg-teal-600 mt-6 w-full text-center">管理學生</router-link>
      </div>

      <!-- 快速入口 3: 成績管理 -->
      <div class="card p-8 flex flex-col items-start hover:shadow-xl transition-shadow">
        <div class="bg-amber-100 p-4 rounded-xl mb-4">
            <svg class="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        </div>
        <h2 class="text-2xl font-bold text-slate-800">成績管理</h2>
        <p class="text-base text-slate-600 mt-2 flex-grow">登錄平時測驗、定期評量成績，並查看課堂表現總分。</p>
        <router-link to="/grades" class="btn bg-amber-500 hover:bg-amber-600 mt-6 w-full text-center">登錄成績</router-link>
      </div>
    </div>

    <!-- QR Code Modal -->
    <div v-if="showQrCode" @click="showQrCode = false" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div @click.stop class="bg-white p-8 rounded-2xl text-center">
            <h3 class="text-2xl font-bold mb-4">學生連線網址</h3>
            <img :src="qrCodeUrl" alt="Connection QR Code" class="w-80 h-80 md:w-96 md:h-96 lg:w-[500px] lg:h-[500px] mx-auto border-8 border-gray-200 rounded-lg">
            <p class="mt-4 text-xl font-mono bg-gray-100 p-3 rounded-md">{{ serverUrl }}</p>
            <p class="mt-2 text-gray-500">請學生使用手機掃描，或在瀏覽器輸入上方網址</p>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { authFetch } from '@/utils/api';

const serverUrl = ref('');
const showQrCode = ref(false);

const qrCodeUrl = computed(() => {
    if (!serverUrl.value) return '';
    // The image requested is 512x512, fulfilling the "at least 500x500" requirement.
    return `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(serverUrl.value)}`;
});

onMounted(async () => {
    try {
        const response = await authFetch('/api/server-info');
        const data = await response.json();
        serverUrl.value = data.url;
    } catch (error) {
        console.error("無法獲取伺服器資訊:", error);
    }
});
</script>

