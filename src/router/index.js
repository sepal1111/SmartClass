// /src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import Login from '../views/Login.vue';
import StudentManagement from '../views/StudentManagement.vue';
import SeatingChart from '../views/SeatingChart.vue';
import Attendance from '../views/Attendance.vue';
import Curriculum from '../views/Curriculum.vue';
import Grades from '../views/Grades.vue';
import Submissions from '../views/Submissions.vue';
import PingPong from '../views/PingPong.vue';
import { account } from '../services/appwrite';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { layout: 'auth' } // 指定 auth 佈局
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/student-management',
    name: 'StudentManagement',
    component: StudentManagement,
    meta: { requiresAuth: true }
  },
  {
    path: '/seating-chart',
    name: 'SeatingChart',
    component: SeatingChart,
    meta: { requiresAuth: true }
  },
  {
    path: '/attendance',
    name: 'Attendance',
    component: Attendance,
    meta: { requiresAuth: true }
  },
  {
    path: '/curriculum',
    name: 'Curriculum',
    component: Curriculum,
    meta: { requiresAuth: true }
  },
  {
    path: '/grades',
    name: 'Grades',
    component: Grades,
    meta: { requiresAuth: true }
  },
  {
    path: '/submissions',
    name: 'Submissions',
    component: Submissions,
    meta: { requiresAuth: true }
  },
  {
    path: '/ping-pong',
    name: 'PingPong',
    component: PingPong,
    meta: { requiresAuth: true }
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守衛
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    try {
      await account.get();
      next();
    } catch (e) {
      next({ name: 'Login' });
    }
  } else {
    next();
  }
});

export default router;
