// File Path: /client/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import StudentManagementView from '../views/StudentManagementView.vue'
import SeatingChartView from '../views/SeatingChartView.vue'
import ClassroomDashboardView from '../views/ClassroomDashboardView.vue'
import AssignmentsView from '../views/AssignmentsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/students',
      name: 'students',
      component: StudentManagementView,
    },
    {
      path: '/seating-chart',
      name: 'seating-chart',
      component: SeatingChartView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: ClassroomDashboardView,
    },
    {
      path: '/assignments',
      name: 'assignments',
      component: AssignmentsView,
    }
  ]
})

export default router
