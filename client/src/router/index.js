// File Path: /client/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import StudentManagementView from '../views/StudentManagementView.vue'
import SeatingChartView from '../views/SeatingChartView.vue'
import ClassroomDashboardView from '../views/ClassroomDashboardView.vue'
import AssignmentsView from '../views/AssignmentsView.vue'
import StudentDashboardView from '../views/StudentDashboardView.vue'
import AuthView from '../views/AuthView.vue' // 引入新的統一認證頁面


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // --- 教師端路由 ---
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true, layout: 'default' }
    },
    {
      path: '/students',
      name: 'student-management',
      component: StudentManagementView,
      meta: { requiresAuth: true, layout: 'default' }
    },
    {
      path: '/seating-chart',
      name: 'seating-chart',
      component: SeatingChartView,
      meta: { requiresAuth: true, layout: 'default' }
    },
    {
      path: '/dashboard',
      name: 'classroom-dashboard',
      component: ClassroomDashboardView,
      meta: { requiresAuth: true, layout: 'default' }
    },
    {
      path: '/assignments',
      name: 'assignments',
      component: AssignmentsView,
      meta: { requiresAuth: true, layout: 'default' }
    },
    
    // --- 統一認證路由 ---
    {
      path: '/login',
      name: 'auth',
      component: AuthView,
      meta: { layout: 'clean' }
    },

    // --- 學生端路由 ---
    {
      path: '/student/dashboard',
      name: 'student-dashboard',
      component: StudentDashboardView,
      meta: { requiresStudentAuth: true, layout: 'clean' }
    }
  ]
})

// 全域路由守衛
router.beforeEach((to, from, next) => {
  const studentToken = localStorage.getItem('studentToken');
  const teacherToken = localStorage.getItem('teacherToken');

  // 如果目標是登入頁
  if (to.name === 'auth') {
    // 如果已有教師 token，直接導向教師首頁
    if (teacherToken) {
      next({ name: 'home' });
      return;
    }
    // 如果已有學生 token，直接導向學生儀表板
    if (studentToken) {
      next({ name: 'student-dashboard' });
      return;
    }
  }

  // 檢查需要教師權限的頁面
  if (to.meta.requiresAuth && !teacherToken) {
    next({ name: 'auth' }); // 未登入則導向統一登入頁
  // 檢查需要學生權限的頁面
  } else if (to.meta.requiresStudentAuth && !studentToken) {
    next({ name: 'auth' }); // 未登入則導向統一登入頁
  } else {
    next(); // 其他情況皆放行
  }
});


export default router
