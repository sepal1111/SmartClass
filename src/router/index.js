// /src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '../store/auth';

// 頁面組件
import Dashboard from '../views/Dashboard.vue';
import Login from '../views/Login.vue';
import ResetPassword from '../views/ResetPassword.vue';
import StudentManagement from '../views/StudentManagement.vue';
import SeatingChart from '../views/SeatingChart.vue';
import Attendance from '../views/Attendance.vue';
import Curriculum from '../views/Curriculum.vue';
import Grades from '../views/Grades.vue';
import Submissions from '../views/Submissions.vue';
import PingPong from '../views/PingPong.vue';

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', name: 'Login', component: Login, meta: { requiresGuest: true } },
  { path: '/reset-password', name: 'ResetPassword', component: ResetPassword, meta: { requiresGuest: true } },
  { 
    path: '/dashboard', 
    name: 'Dashboard', 
    component: Dashboard,
    meta: { requiresAuth: true } 
  },
  { path: '/students', name: 'StudentManagement', component: StudentManagement, meta: { requiresAuth: true } },
  { path: '/seating-chart', name: 'SeatingChart', component: SeatingChart, meta: { requiresAuth: true } },
  { path: '/attendance', name: 'Attendance', component: Attendance, meta: { requiresAuth: true } },
  { path: '/curriculum', name: 'Curriculum', component: Curriculum, meta: { requiresAuth: true } },
  { path: '/grades', name: 'Grades', component: Grades, meta: { requiresAuth: true } },
  { path: '/submissions', name: 'Submissions', component: Submissions, meta: { requiresAuth: true } },
  { path: '/ping-pong', name: 'PingPong', component: PingPong, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 全域路由守衛
router.beforeEach(async (to, from, next) => {
  const auth = useAuth();

  // 這是確保應用程式啟動時狀態正確的關鍵
  // 如果 isLoading 仍為 true，代表初始的狀態檢查還沒完成
  if (auth.isLoading) {
    await auth.checkAuthStatus();
  }

  const isLoggedIn = auth.isLoggedIn;

  if (to.meta.requiresAuth && !isLoggedIn) {
    // 如果目標頁面需要登入，但使用者未登入，則導向登入頁
    next({ name: 'Login' });
  } else if (to.meta.requiresGuest && isLoggedIn) {
    // 如果目標頁面是給訪客的(如登入頁)，但使用者已登入，則導向主控台
    next({ name: 'Dashboard' });
  } else {
    // 其他情況，正常放行
    next();
  }
});

export default router;

