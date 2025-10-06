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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/auth', name: 'auth', component: AuthView, meta: { layout: 'clean' } },
    { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true, layout: 'default' } },
    { path: '/students', name: 'student-management', component: StudentManagementView, meta: { requiresAuth: true, layout: 'default' } },
    { path: '/seating-chart', name: 'seating-chart', component: SeatingChartView, meta: { requiresAuth: true, layout: 'default' } },
    { path: '/dashboard', name: 'classroom-dashboard', component: ClassroomDashboardView, meta: { requiresAuth: true, layout: 'default' } },
    { path: '/assignments', name: 'assignments', component: AssignmentsView, meta: { requiresAuth: true, layout: 'default' } },
    { path: '/grades', name: 'grade-management', component: GradeManagementView, meta: { requiresAuth: true, layout: 'default' } },
    { path: '/student/dashboard', name: 'student-dashboard', component: StudentDashboardView, meta: { requiresStudentAuth: true, layout: 'clean' } },
  ]
})

router.beforeEach((to, from, next) => {
  const isTeacherAuthenticated = !!localStorage.getItem('teacherToken');
  const isStudentAuthenticated = !!localStorage.getItem('studentToken');

  if (to.meta.requiresAuth && !isTeacherAuthenticated) {
    next({ name: 'auth' });
  } else if (to.meta.requiresStudentAuth && !isStudentAuthenticated) {
    next({ name: 'auth' });
  } else if (to.name === 'auth' && (isTeacherAuthenticated || isStudentAuthenticated)) {
    next({ name: isTeacherAuthenticated ? 'home' : 'student-dashboard' });
  }
  else {
    next();
  }
});

export default router

