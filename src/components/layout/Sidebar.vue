<!-- /src/components/layout/Sidebar.vue -->
<template>
  <div class="w-64 bg-gray-800 text-white flex flex-col">
    <div class="h-16 flex items-center justify-center text-2xl font-bold">
      智慧班級平台
    </div>
    <nav class="flex-1 px-2 py-4 space-y-2">
      <router-link to="/dashboard" class="block px-4 py-2 rounded hover:bg-gray-700">儀表板</router-link>
      <router-link to="/students" class="block px-4 py-2 rounded hover:bg-gray-700">學生管理</router-link>
      <router-link to="/seating-chart" class="block px-4 py-2 rounded hover:bg-gray-700">座位表</router-link>
      <router-link to="/attendance" class="block px-4 py-2 rounded hover:bg-gray-700">每日出缺席</router-link>
      <router-link to="/curriculum" class="block px-4 py-2 rounded hover:bg-gray-700">課程管理</router-link>
      <router-link to="/grades" class="block px-4 py-2 rounded hover:bg-gray-700">成績紀錄</router-link>
      <router-link to="/submissions" class="block px-4 py-2 rounded hover:bg-gray-700">數位作品繳交</router-link>
      <router-link to="/ping-pong" class="block px-4 py-2 rounded hover:bg-gray-700">互動功能</router-link>
    </nav>
  </div>
</template>

