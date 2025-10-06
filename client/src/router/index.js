// File Path: /client/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import StudentManagementView from '../views/StudentManagementView.vue'
import SeatingChartView from '../views/SeatingChartView.vue'
import ClassroomDashboardView from '../views/ClassroomDashboardView.vue'
import AssignmentsView from '../views/AssignmentsView.vue'
import StudentLoginView from '../views/StudentLoginView.vue'
import StudentDashboardView from '../views/StudentDashboardView.vue'
// 將舊的 TeacherLoginView 替換成新的 TeacherAuthView
import TeacherAuthView from '../views/TeacherAuthView.vue'


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
    {
      path: '/teacher/login',
      name: 'teacher-auth', // 路由名稱更新
      component: TeacherAuthView,
      meta: { layout: 'clean' }
    },

    // --- 學生入口路由 ---
    {
      path: '/login',
      name: 'student-login',
      component: StudentLoginView,
      meta: { layout: 'clean' }
    },
    {
      path: '/student/dashboard',
      name: 'student-dashboard',
      component: StudentDashboardView,
      meta: { requiresStudentAuth: true, layout: 'clean' }
    }
  ]
})

// 更新路由守衛
router.beforeEach((to, from, next) => {
  const studentToken = localStorage.getItem('studentToken');
  const teacherToken = localStorage.getItem('teacherToken');

  if (to.meta.requiresStudentAuth && !studentToken) {
    next({ name: 'student-login' });
  } else if (to.meta.requiresAuth && !teacherToken) {
    next({ name: 'teacher-auth' }); // 指向新的教師認證頁面
  } else if (to.name === 'student-login' && studentToken) {
    next({ name: 'student-dashboard' });
  } else if (to.name === 'teacher-auth' && teacherToken) {
    next({ name: 'home' });
  }
  else {
    next();
  }
});


export default router

