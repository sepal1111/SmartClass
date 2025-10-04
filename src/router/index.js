// /src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
// 之後會用 store 來檢查認證狀態
// import { useAuthStore } from '@/store/auth';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('../views/ResetPassword.vue'),
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }, // 表示此頁面需要登入
  },
  {
    path: '/student-management',
    name: 'StudentManagement',
    component: () => import('../views/StudentManagement.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/seating-chart',
    name: 'SeatingChart',
    component: () => import('../views/SeatingChart.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/attendance',
    name: 'Attendance',
    component: () => import('../views/Attendance.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/curriculum',
    name: 'Curriculum',
    component: () => import('../views/Curriculum.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/grades',
    name: 'Grades',
    component: () => import('../views/Grades.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/submissions',
    name: 'Submissions',
    component: () => import('../views/Submissions.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/pingpong',
    name: 'PingPong',
    component: () => import('../views/PingPong.vue'),
    meta: { requiresAuth: true },
  },
  // 如果找不到頁面，可以重導向到首頁
  {
    path: '/:catchAll(.*)',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守衛 (Navigation Guard)
router.beforeEach((to, from, next) => {
  // 之後會在這裡啟用真正的認證檢查
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthenticated = false; // 這裡先假設為未登入，方便測試
  // const authStore = useAuthStore();
  // const isAuthenticated = authStore.isAuthenticated;

  if (requiresAuth && !isAuthenticated) {
    // 如果頁面需要登入但使用者未登入，導向登入頁
    next('/login');
  } else {
    // 否則正常進入
    next();
  }
});

export default router;

