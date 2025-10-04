<!-- /src/components/layout/Sidebar.vue -->
<template>
  <aside class="w-64 bg-gray-800 text-white flex flex-col p-4">
    <div class="text-2xl font-bold mb-10">功能選單</div>
    <nav>
      <ul>
        <li v-for="item in menuItems" :key="item.name" class="mb-4">
          <router-link
            :to="item.path"
            class="flex items-center p-2 rounded-md transition-colors duration-200"
            active-class="bg-gray-700"
            exact-active-class="bg-gray-600"
          >
            <!-- 這裡可以放 Icon -->
            <span class="mx-4">{{ item.name }}</span>
          </router-link>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script setup>
const menuItems = [
  { name: '主控台', path: '/' },
  { name: '學生管理', path: '/student-management' },
  { name: '座位表', path: '/seating-chart' },
  { name: '每日出缺席', path: '/attendance' },
  { name: '課程管理', path: '/curriculum' },
  { name: '成績紀錄', path: '/grades' },
  { name: '數位作品繳交', path: '/submissions' },
  { name: '互動功能', path: '/pingpong' },
];
</script>

<style scoped>
/* 當前路由的精確匹配樣式 */
.router-link-exact-active {
  background-color: #4a5568; /* a bit darker gray */
  color: #fff;
}
</style>

