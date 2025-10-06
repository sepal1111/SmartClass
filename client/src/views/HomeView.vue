<!-- File Path: /client/src/views/HomeView.vue -->
<template>
  <main>
    <div class="bg-white p-8 rounded-lg shadow-md">
      <h1 class="text-3xl font-bold text-gray-800">歡迎來到智慧班級管理平台</h1>
      <p class="mt-4 text-lg text-gray-600">
        您已成功登入。請從左側的功能選單開始您的班級管理工作。
      </p>
      <div class="mt-6 border-t pt-6">
        <h2 class="text-xl font-semibold text-gray-700">快速開始</h2>
        <ul class="mt-4 space-y-2 list-disc list-inside text-gray-600">
          <li>
            <router-link to="/students" class="text-blue-600 hover:underline">管理學生名單</router-link> - 新增、編輯或匯入學生資料。
          </li>
          <li>
            <router-link to="/seating-chart" class="text-blue-600 hover:underline">設定座位表</router-link> - 拖曳學生以安排座位。
          </li>
          <li>
             <router-link to="/assignments" class="text-blue-600 hover:underline">建立新的作業</router-link> - 發布作業並設定繳交期限。
          </li>
        </ul>
      </div>
    </div>
  </main>
</template>

<script setup>
// 這個頁面現在是一個靜態的歡迎頁面，不需要特殊的邏輯。
</script>

