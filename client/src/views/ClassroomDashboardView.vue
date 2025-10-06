<!-- File Path: /client/src/views/ClassroomDashboardView.vue -->
<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">班級儀表板</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- 總學生數 -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-lg font-semibold text-gray-700">總學生數</h2>
        <p v-if="isLoading" class="text-2xl font-bold mt-2">讀取中...</p>
        <p v-else class="text-3xl font-bold mt-2">{{ students.length }} 人</p>
      </div>

      <!-- 出缺席狀況 (示意) -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-lg font-semibold text-gray-700">今日出缺席 ({{ today }})</h2>
        <div class="mt-2">
          <p>出席: <span class="font-bold text-green-600">N/A</span></p>
          <p>缺席: <span class="font-bold text-red-600">N/A</span></p>
           <button class="mt-2 text-sm text-blue-500 hover:underline">查看詳細</button>
        </div>
      </div>

       <!-- 隨機抽籤 (示意) -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-lg font-semibold text-gray-700">隨機抽籤</h2>
        <div class="mt-2">
            <button class="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600">開始抽籤</button>
            <p class="mt-2 font-bold text-xl h-8"></p>
        </div>
      </div>
    </div>
    
    <div class="mt-6 bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4">功能說明</h2>
        <p class="text-gray-600">此頁面為功能示意，顯示班級的即時資訊。未來將會整合出缺席統計、學習表現、隨機抽籤等互動功能。</p>
        <p v-if="error" class="text-red-500 mt-4">{{ error }}</p>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { authFetch } from '@/utils/api'; // 引入 authFetch

const students = ref([]);
const isLoading = ref(true);
const error = ref('');

const today = computed(() => new Date().toLocaleDateString());

const fetchStudents = async () => {
    isLoading.value = true;
    error.value = '';
    try {
        const response = await authFetch('/api/students'); // 使用 authFetch
        if (!response.ok) throw new Error('無法讀取學生資料');
        students.value = await response.json();
    } catch (err) {
        error.value = `錯誤: ${err.message}`;
    } finally {
        isLoading.value = false;
    }
};


onMounted(() => {
    fetchStudents();
});
</script>

