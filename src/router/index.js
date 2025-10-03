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
import ResetPassword from '../views/ResetPassword.vue';

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', name: 'Login', component: Login },
  { path: '/reset-password', name: 'ResetPassword', component: ResetPassword },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard },
  { path: '/students', name: 'StudentManagement', component: StudentManagement },
  { path: '/seating-chart', name: 'SeatingChart', component: SeatingChart },
  { path: '/attendance', name: 'Attendance', component: Attendance },
  { path: '/curriculum', name: 'Curriculum', component: Curriculum },
  { path: '/grades', name: 'Grades', component: Grades },
  { path: '/submissions', name: 'Submissions', component: Submissions },
  { path: '/ping-pong', name: 'PingPong', component: PingPong },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

