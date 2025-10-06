// File Path: /client/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import StudentManagementView from '../views/StudentManagementView.vue'
import SeatingChartView from '../views/SeatingChartView.vue'
import ClassroomDashboardView from '../views/ClassroomDashboardView.vue'
import AssignmentsView from '../views/AssignmentsView.vue'
// 新增學生端頁面
import StudentLoginView from '../views/StudentLoginView.vue'
import StudentDashboardView from '../views/StudentDashboardView.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
    // --- 學生入口路由 ---
    {
      path: '/login',
      name: 'student-login',
      component: StudentLoginView,
      meta: { layout: 'clean' } // 使用一個乾淨的佈局，沒有導覽列
    },
    {
      path: '/student/dashboard',
      name: 'student-dashboard',
      component: StudentDashboardView,
      meta: { requiresStudentAuth: true, layout: 'clean' }
    }
  ]
})

// 簡易的路由守衛
router.beforeEach((to, from, next) => {
  const studentToken = localStorage.getItem('studentToken');

  if (to.meta.requiresStudentAuth && !studentToken) {
    // 如果頁面需要學生登入但沒有 token，導向登入頁
    next({ name: 'student-login' });
  } else if (to.name === 'student-login' && studentToken) {
    // 如果已登入，但又想去登入頁，直接導向學生儀表板
    next({ name: 'student-dashboard' });
  }
  else {
    // 教師端或其他情況，暫時先全部放行
    // 未來可以加入教師登入邏輯
    next();
  }
});


export default router

