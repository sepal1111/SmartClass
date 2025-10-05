<!-- File Path: /client/src/App.vue -->
<template>
    <div id="app-container" class="min-h-screen bg-gray-100 font-sans">
      <header class="bg-white shadow-md">
        <nav class="container mx-auto px-6 py-3">
          <div class="flex justify-between items-center">
            <h1 class="text-xl font-bold text-gray-800">智慧班級管理平台</h1>
            <div class="flex items-center">
              <router-link to="/" class="mx-2 text-gray-600 hover:text-blue-500">首頁</router-link>
              <router-link to="/students" class="mx-2 text-gray-600 hover:text-blue-500">學生管理</router-link>
              <router-link to="/seating-chart" class="mx-2 text-gray-600 hover:text-blue-500">座位表</router-link>
              <router-link to="/dashboard" class="mx-2 text-gray-600 hover:text-blue-500">課堂儀表板</router-link>
              <router-link to="/assignments" class="mx-2 text-gray-600 hover:text-blue-500">作業管理</router-link>
            </div>
          </div>
        </nav>
      </header>
  
      <main class="container mx-auto px-6 py-8">
        <router-view />
      </main>
    </div>
  </template>
  
  <script setup>
  </script>
  