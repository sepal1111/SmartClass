<!-- File Path: /client/src/views/HomeView.vue -->
<template>
    <div class="home-container p-8 bg-white rounded-lg shadow-md">
      <h1 class="text-4xl font-bold mb-4">歡迎使用智慧班級管理平台</h1>
      <p class="text-lg text-gray-600 mb-6">
        這是一個本地運行的班級管理系統，所有資料都安全地儲存在您的電腦上。
      </p>
  
      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-gray-50 p-6 rounded-lg border">
          <h2 class="text-2xl font-semibold mb-3">功能導覽</h2>
          <ul class="list-disc list-inside space-y-2 text-gray-700">
            <li><b>學生管理：</b>批次匯入、新增、編輯和刪除學生資料。</li>
            <li><b>座位表：</b>透過拖曳方式直觀地安排學生座位。</li>
            <li><b>課堂儀表板：</b>快速登記每日出缺席與課堂表現。</li>
            <li><b>作業管理：</b>建立作業項目並管理繳交的數位檔案。</li>
          </ul>
        </div>
        <div class="bg-gray-50 p-6 rounded-lg border">
          <h2 class="text-2xl font-semibold mb-3">連線狀態測試</h2>
          <p class="mb-4 text-gray-700">點擊下方按鈕來確認前端介面是否能與後端伺服器正常通訊。</p>
          <button @click="testConnection" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300">
            測試後端連線
          </button>
          <p v-if="testResult" class="mt-4 p-3 rounded-md text-sm" :class="testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
            {{ testResult.message }}
          </p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  const testResult = ref(null);
  
  const testConnection = async () => {
    try {
      const response = await fetch('/api/students'); 
      if (response.ok) {
        testResult.value = { success: true, message: '連線成功！後端伺服器已準備就緒。' };
      } else {
        throw new Error(`伺服器回應錯誤: ${response.status}`);
      }
    } catch (error) {
      console.error('連線測試失敗:', error);
      testResult.value = { success: false, message: `連線失敗！請確認後端伺服器是否已啟動。(${error.message})` };
    }
  };
  </script>
  