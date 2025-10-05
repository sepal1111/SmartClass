<!-- File Path: /client/src/views/ClassroomDashboardView.vue -->
<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">課堂儀表板</h1>
      <div class="flex items-center space-x-4">
        <input type="date" v-model="selectedDate" @change="fetchDashboardData" class="block rounded-md border-gray-300 shadow-sm">
        <button @click="saveAttendance" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300">儲存出缺席</button>
      </div>
    </div>
    
    <div v-if="message.text" class="mb-4 p-3 rounded-md text-sm" :class="message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
      {{ message.text }}
    </div>

    <div v-if="loading" class="text-center p-8 text-gray-500">讀取中...</div>
    <div v-else-if="!layout.grid || layout.grid.length === 0" class="text-center p-8 text-gray-500 bg-white rounded-lg shadow-md">
      請先至「座位表」頁面設定座位。
    </div>
    <div v-else class="grid gap-4" :style="{ gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))` }">
      <div 
        v-for="(student, index) in layout.grid" 
        :key="index"
        class="p-3 rounded-lg shadow-md transition-all duration-300"
        :class="getStudentCardClass(student ? student.id : null)"
      >
        <template v-if="student">
          <div @click="toggleAttendance(student.id)" class="cursor-pointer">
            <p class="font-bold text-center text-lg">{{ student.name }}</p>
            <p class="text-center text-sm text-gray-600">{{ attendance[student.id] || '出席' }}</p>
          </div>
          <div class="mt-3 pt-3 border-t flex justify-around items-center">
             <button @click="addPerformance(student.id, -1)" class="w-8 h-8 rounded-full bg-red-500 text-white font-bold text-xl flex items-center justify-center hover:bg-red-600">-</button>
             <p class="text-xl font-bold">{{ performance[student.id] || 0 }}</p>
             <button @click="addPerformance(student.id, 1)" class="w-8 h-8 rounded-full bg-green-500 text-white font-bold text-xl flex items-center justify-center hover:bg-green-600">+</button>
          </div>
        </template>
        <template v-else>
          <div class="flex items-center justify-center h-full">
            <span class="text-gray-400">空位</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const loading = ref(true);
const layout = ref({ rows: 0, cols: 0, grid: [] });
const allStudents = ref([]);
const attendance = ref({}); // { student_id: '出席' | '病假' ... }
const performance = ref({}); // { student_id: 10 }
const selectedDate = ref(new Date().toISOString().slice(0, 10));
const message = ref({ text: '', type: 'success' });

const attendanceStatus = ['出席', '病假', '事假', '公假', '曠課', '遲到'];

const showMessage = (text, type = 'success', duration = 3000) => {
  message.value = { text, type };
  setTimeout(() => { message.value = { text: '', type: 'success' }; }, duration);
};

const fetchDashboardData = async () => {
  loading.value = true;
  try {
    const [layoutRes, studentsRes, attendanceRes, performanceRes] = await Promise.all([
      fetch('/api/seating-chart'),
      fetch('/api/students'),
      fetch(`/api/attendance?date=${selectedDate.value}`),
      fetch(`/api/performance?date=${selectedDate.value}`)
    ]);

    if (!layoutRes.ok || !studentsRes.ok || !attendanceRes.ok || !performanceRes.ok) {
      throw new Error('無法讀取儀表板資料');
    }

    // 處理座位表和學生資料
    const savedLayout = await layoutRes.json();
    allStudents.value = await studentsRes.json();
    const studentMap = new Map(allStudents.value.map(s => [s.id, s]));
    savedLayout.grid = savedLayout.grid.map(studentId => studentMap.get(studentId) || null);
    layout.value = savedLayout;

    // 處理出缺席資料
    const attendanceRecords = await attendanceRes.json();
    attendance.value = Object.fromEntries(attendanceRecords.map(r => [r.student_id, r.status]));

    // 處理表現分數
    const performanceRecords = await performanceRes.json();
    performance.value = Object.fromEntries(performanceRecords.map(r => [r.student_id, r.total_score]));

  } catch (error) {
    showMessage(error.message, 'error');
  } finally {
    loading.value = false;
  }
};

const getStudentCardClass = (studentId) => {
  if (!studentId) return 'bg-gray-100 border-2 border-dashed';
  const status = attendance.value[studentId] || '出席';
  switch (status) {
    case '出席': return 'bg-white';
    case '病假':
    case '事假': return 'bg-yellow-100';
    case '曠課': return 'bg-red-200';
    case '遲到': return 'bg-orange-100';
    default: return 'bg-blue-100';
  }
};

const toggleAttendance = (studentId) => {
  const currentStatus = attendance.value[studentId] || '出席';
  const currentIndex = attendanceStatus.indexOf(currentStatus);
  const nextIndex = (currentIndex + 1) % attendanceStatus.length;
  attendance.value[studentId] = attendanceStatus[nextIndex];
};

const saveAttendance = async () => {
  try {
    const recordsToSave = allStudents.value.map(s => ({
      student_id: s.id,
      status: attendance.value[s.id] || '出席'
    }));
    
    const response = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: selectedDate.value, records: recordsToSave })
    });
    if (!response.ok) throw new Error('儲存出缺席紀錄失敗');
    showMessage('出缺席紀錄已成功儲存！', 'success');
  } catch (error) {
    showMessage(error.message, 'error');
  }
};

const addPerformance = async (studentId, points) => {
    try {
        const response = await fetch('/api/performance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({
                student_id: studentId,
                date: selectedDate.value,
                points: points
            })
        });
        if (!response.ok) throw new Error('紀錄分數失敗');
        
        // 即時更新前端分數
        if (!performance.value[studentId]) {
            performance.value[studentId] = 0;
        }
        performance.value[studentId] += points;
        showMessage(`${points > 0 ? '加分' : '減分'}成功！`, 'success', 1500);

    } catch (error) {
        showMessage(error.message, 'error');
    }
}

onMounted(fetchDashboardData);
</script>
