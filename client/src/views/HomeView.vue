<!-- File Path: /client/src/views/HomeView.vue -->
<template>
  <div>
    <h1 class="text-4xl font-bold text-slate-800 mb-2">歡迎使用智慧班級系統</h1>
    <p class="text-lg text-slate-600 mb-8">您可以從左側導覽列選擇功能，或透過下方快速入口開始。</p>

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
  </div>
</template>

<script setup>
// This component currently requires no specific script logic.
// Navigation is handled by <router-link>.
</script>

<style scoped>
/* Scoped styles can be added here if needed */
</style>
