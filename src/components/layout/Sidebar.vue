<!-- /src/components/layout/Sidebar.vue -->
<template>
  <aside class="w-64 flex-shrink-0 bg-white shadow-md hidden md:block">
    <div class="p-6">
      <h1 class="text-2xl font-bold text-indigo-600">智慧班級平台</h1>
    </div>
    <nav class="mt-6">
      <router-link v-for="item in menuItems" :key="item.name" :to="item.path"
        class="flex items-center px-6 py-3 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200"
        active-class="bg-indigo-100 text-indigo-700 font-semibold border-r-4 border-indigo-500">
        <span>{{ item.label }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
const menuItems = [
  { name: 'Dashboard', path: '/', label: '儀表板' },
  { name: 'StudentManagement', path: '/student-management', label: '學生管理' },
  { name: 'SeatingChart', path: '/seating-chart', label: '座位表' },
  { name: 'Attendance', path: '/attendance', label: '每日出缺席' },
  { name: 'Curriculum', path: '/curriculum', label: '課程管理' },
  { name: 'Grades', path: '/grades', label: '成績紀錄' },
  { name: 'Submissions', path: '/submissions', label: '數位作品繳交' },
  { name: 'PingPong', path: '/ping-pong', label: '互動功能' },
];
</script>
