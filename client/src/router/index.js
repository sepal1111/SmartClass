// File Path: /client/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import StudentManagementView from '../views/StudentManagementView.vue'
import SeatingChartView from '../views/SeatingChartView.vue'
import ClassroomDashboardView from '../views/ClassroomDashboardView.vue'
import AssignmentsView from '../views/AssignmentsView.vue'
import GradeManagementView from '../views/GradeManagementView.vue'
import StudentDashboardView from '../views/StudentDashboardView.vue'
import AuthView from '../views/AuthView.vue'
import TeacherPingPongView from '../views/TeacherPingPongView.vue'
import StudentPingPongView from '../views/StudentPingPongView.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // --- 統一認證入口 ---
    {
      path: '/auth',
      name: 'auth',
      component: AuthView,
      meta: { layout: 'clean' }
    },

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
     {
      path: '/grades',
      name: 'grade-management',
      component: GradeManagementView,
      meta: { requiresAuth: true, layout: 'default' }
    },
    {
      path: '/pingpong-teacher',
      name: 'pingpong-teacher',
      component: TeacherPingPongView,
      meta: { requiresAuth: true, layout: 'default' }
    },

    // --- 學生端路由 ---
    {
      path: '/student/dashboard',
      name: 'student-dashboard',
      component: StudentDashboardView,
      meta: { requiresStudentAuth: true, layout: 'clean' }
    },
     {
      path: '/pingpong-student',
      name: 'pingpong-student',
      component: StudentPingPongView,
      meta: { layout: 'clean' }
    },
  ]
})

// 更新路由守衛
router.beforeEach((to, from, next) => {
  const isTeacherAuthenticated = !!localStorage.getItem('teacherToken');
  const isStudentAuthenticated = !!localStorage.getItem('studentToken');

  if (to.meta.requiresAuth && !isTeacherAuthenticated) {
    // 老師頁面需要登入但未登入，導向登入頁
    next({ name: 'auth' });
  } else if (to.meta.requiresStudentAuth && !isStudentAuthenticated) {
    // 學生頁面需要登入但未登入，導向登入頁
    next({ name: 'auth' });
  } else if (to.name === 'auth' && (isTeacherAuthenticated || isStudentAuthenticated)) {
     // 如果已登入，卻想去登入頁，則根據身分導向各自的首頁
    if (isTeacherAuthenticated) {
      next({ name: 'home' });
    } else {
      next({ name: 'student-dashboard' });
    }
  }
  else {
    next();
  }
});


export default router

