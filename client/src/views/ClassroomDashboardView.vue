<!-- File Path: /client/src/views/ClassroomDashboardView.vue -->
<template>
  <div>
    <h1 class="text-4xl font-bold text-slate-800 mb-8">班級儀表板</h1>

    <!-- 頂部資訊卡 -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
      <!-- 出缺席狀況 -->
      <div class="card h-full">
        <div class="flex justify-between items-start mb-4">
          <h2 class="text-xl font-semibold text-slate-700">今日出缺席 ({{ today_display }})</h2>
          <div class="flex space-x-2">
              <button @click="openAttendanceModal" class="btn btn-secondary px-3 py-1 text-sm">批次登記</button>
              <button @click="openAttendanceSummaryModal" class="btn bg-slate-600 hover:bg-slate-700 px-3 py-1 text-sm">學期統計</button>
          </div>
        </div>
        <div v-if="isLoading" class="mt-2 text-center py-8">讀取中...</div>
        <div v-else class="grid grid-cols-3 gap-4 text-center">
          <div>
            <p class="text-5xl font-bold text-green-600">{{ attendanceStats.present }}</p>
            <p class="text-base text-slate-500">出席</p>
          </div>
          <div>
            <p class="text-5xl font-bold text-orange-500">{{ attendanceStats.leave }}</p>
            <p class="text-base text-slate-500">請假</p>
          </div>
          <div>
            <p class="text-5xl font-bold text-red-600">{{ attendanceStats.absent }}</p>
            <p class="text-base text-slate-500">曠課</p>
          </div>
        </div>
      </div>

      <!-- 隨機抽籤 -->
      <div class="card flex flex-col items-center justify-center text-center h-full">
        <h2 class="text-xl font-semibold text-slate-700 mb-4">隨機抽籤</h2>
        <button @click="pickRandomStudent" class="btn btn-primary text-xl px-8 py-4 rounded-full" :disabled="isPicking">
            {{ isPicking ? '抽籤中...' : '開始抽籤' }}
        </button>
        <p class="mt-3 text-sm h-8 text-slate-400">點擊按鈕從出席學生中抽籤</p>
      </div>
       <!-- 總學生數 -->
      <div class="card flex flex-col items-center justify-center text-center h-full">
        <h2 class="text-xl font-semibold text-slate-700">座位表學生總數</h2>
        <p v-if="isLoading" class="text-5xl font-bold mt-4">...</p>
        <p v-else class="text-6xl font-bold text-slate-800 mt-4">{{ totalStudentsInChart }} <span class="text-2xl text-slate-500">人</span></p>
      </div>
    </div>
    
    <!-- 錯誤提示 -->
    <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
        <p class="font-bold">發生錯誤：</p>
        <p>{{ error }}</p>
    </div>

    <!-- 互動式座位表 -->
    <div class="card p-4">
        <div v-if="isLoading" class="text-center py-16">座位表讀取中...</div>
        <div v-else :style="gridStyle" class="grid gap-3">
            <div v-for="i in (seatingChart.rows * seatingChart.cols)" :key="i"
                 class="h-36 rounded-xl flex flex-col justify-center items-center text-center p-2 transition-all duration-300 relative border-2"
                 :class="getSeatClasses(seatingChart.seats[i-1])">
                
                <div v-if="seatingChart.seats[i-1]" 
                     @click="handleSeatClick(seatingChart.seats[i-1])" 
                     class="w-full h-full flex flex-col justify-between p-2"
                     :class="(attendance[seatingChart.seats[i-1].student_id] || 'present') === 'present' ? 'cursor-pointer' : 'cursor-not-allowed'">
                    
                    <!-- Performance Badge -->
                    <div class="absolute top-2 right-2 rounded-full h-9 w-9 flex items-center justify-center text-lg font-bold text-white shadow-md" :class="getPerformanceBadgeClass(seatingChart.seats[i-1])">
                      {{ performance[seatingChart.seats[i-1].student_id] || 0 }}
                    </div>

                    <!-- Attendance Icon -->
                    <div class="absolute top-2 left-2 text-slate-500">
                        <svg v-if="getAttendanceStatus(seatingChart.seats[i-1].student_id) === 'sick'" class="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <svg v-if="['official', 'personal'].includes(getAttendanceStatus(seatingChart.seats[i-1].student_id))" class="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <svg v-if="getAttendanceStatus(seatingChart.seats[i-1].student_id) === 'absent'" class="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                    </div>

                    <div class="flex-grow flex flex-col items-center justify-center pt-4">
                      <p class="font-bold text-xl leading-tight">{{ seatingChart.seats[i-1].name }}</p>
                      <p class="text-sm text-slate-600 mt-1">({{ seatingChart.seats[i-1].seat_number }})</p>
                    </div>
                </div>
                 <div v-else class="text-slate-400 text-sm">(空位)</div>
            </div>
        </div>
    </div>

    <!-- 學生加減分 Modal -->
    <div v-if="isScoreModalOpen" class="fixed z-20 inset-0 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen">
            <div class="fixed inset-0 transition-opacity" aria-hidden="true" @click="isScoreModalOpen = false">
                <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div class="inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all my-8 max-w-sm w-full">
                <div class="bg-white p-6">
                    <h3 class="text-2xl leading-6 font-bold text-gray-900 text-center mb-2">
                        {{ selectedStudentForModal.name }}
                    </h3>
                    
                    <div class="my-4 text-center">
                        <p class="text-base font-medium text-gray-500">本日累計分數</p>
                        <p class="text-7xl font-bold" :class="studentScoreColor">{{ studentScoreForModal }}</p>
                    </div>

                    <div>
                        <h4 class="font-semibold text-center mt-6 text-gray-600">調整分數</h4>
                        <div class="grid grid-cols-2 gap-4 mt-2">
                            <button @click="addPerformance(1)" class="btn btn-primary text-lg py-3">+1 分</button>
                            <button @click="addPerformance(-1)" class="btn btn-warning text-lg py-3">-1 分</button>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 text-right">
                    <button @click="isScoreModalOpen = false" type="button" class="btn btn-secondary">關閉</button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- 批次出缺席 Modal -->
    <div v-if="isAttendanceModalOpen" class="fixed z-30 inset-0 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen">
        <div class="fixed inset-0 transition-opacity" aria-hidden="true" @click="isAttendanceModalOpen = false">
          <div class="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
        <div class="inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all my-8 max-w-5xl w-full">
          <div class="bg-white px-6 pt-5 pb-4">
            <h3 class="text-2xl font-bold text-gray-900 mb-4">批次登記今日出缺席</h3>
            <div class="max-h-[60vh] overflow-y-auto pr-4">
              <div v-for="student in sortedStudentsForModal" :key="student.id" class="grid grid-cols-6 gap-4 items-center mb-2 p-2 rounded-md hover:bg-slate-50">
                <div class="col-span-1 font-semibold text-lg">{{ student.seat_number }}. {{ student.name }}</div>
                <div class="col-span-5 grid grid-cols-5 gap-2">
                  <button v-for="type in Object.keys(attendanceTypes)" :key="type" @click="setTempAttendance(student.student_id, type)"
                          class="px-2 py-2 text-base rounded-md transition-colors"
                          :class="getAttendanceButtonClass(student.student_id, type)">
                    {{ attendanceTypes[type].label }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-100 px-6 py-4 flex justify-end space-x-4">
            <button @click="isAttendanceModalOpen = false" type="button" class="btn btn-secondary text-base py-2 px-6">取消</button>
            <button @click="saveAttendanceChanges" type="button" class="btn bg-purple-600 hover:bg-purple-700 text-base py-2 px-6">儲存變更</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 中籤學生 Modal -->
    <div v-if="isPickerModalOpen && randomlyPickedStudent" class="fixed z-40 inset-0 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen">
            <div class="fixed inset-0 transition-opacity" aria-hidden="true" @click="closePickerModal">
                <div class="absolute inset-0 bg-gray-800 opacity-75"></div>
            </div>
            
            <div class="inline-block bg-white rounded-2xl text-center overflow-hidden shadow-2xl transform transition-all my-8 max-w-md w-full relative border-4 border-yellow-400">
                <div class="p-8 sm:p-12 relative">
                    <p class="text-xl font-medium text-indigo-600">恭喜！抽中了...</p>
                    <p class="text-8xl font-extrabold text-gray-900 my-4">{{ randomlyPickedStudent.name }}</p>
                    <p class="text-3xl text-gray-500 font-semibold">{{ randomlyPickedStudent.seat_number }} 號</p>
                    <div class="mt-8">
                        <button @click="closePickerModal" type="button" class="btn btn-primary text-lg px-8 py-3">
                            關閉
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 學期出缺席統計 Modal -->
    <div v-if="isAttendanceSummaryModalOpen" class="fixed z-50 inset-0 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="fixed inset-0 transition-opacity" aria-hidden="true" @click="isAttendanceSummaryModalOpen = false">
          <div class="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
        <div class="inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all my-8 max-w-6xl w-full">
          <div class="bg-white px-6 pt-5 pb-4">
            <h3 class="text-2xl font-bold text-gray-900 mb-4">學期出缺席統計</h3>
            <div class="flex items-center space-x-4 mb-4 p-4 bg-slate-50 rounded-md">
                <label for="startDate" class="text-sm font-medium">開始日期:</label>
                <input type="date" id="startDate" v-model="summaryStartDate" class="form-input">
                <label for="endDate" class="text-sm font-medium">結束日期:</label>
                <input type="date" id="endDate" v-model="summaryEndDate" class="form-input">
                <button @click="fetchAttendanceSummary" class="btn btn-primary">查詢</button>
            </div>
            <div class="max-h-[60vh] overflow-y-auto">
              <div v-if="summaryLoading" class="text-center py-8">正在讀取統計資料...</div>
              <table v-else class="min-w-full divide-y divide-gray-200">
                <thead class="bg-slate-50 sticky top-0">
                  <tr>
                    <th class="px-4 py-3 text-left text-sm font-medium uppercase">座號</th>
                    <th class="px-4 py-3 text-left text-sm font-medium uppercase">姓名</th>
                    <th class="px-4 py-3 text-center text-sm font-medium uppercase text-green-600">出席</th>
                    <th class="px-4 py-3 text-center text-sm font-medium uppercase text-orange-600">病假</th>
                    <th class="px-4 py-3 text-center text-sm font-medium uppercase text-blue-600">公假</th>
                    <th class="px-4 py-3 text-center text-sm font-medium uppercase text-yellow-600">事假</th>
                    <th class="px-4 py-3 text-center text-sm font-medium uppercase text-red-600">曠課</th>
                    <th class="px-4 py-3 text-center text-sm font-medium uppercase">出席率</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="record in attendanceSummaryData" :key="record.student_id" class="hover:bg-slate-50">
                    <td class="px-4 py-3 whitespace-nowrap">{{ record.seat_number }}</td>
                    <td class="px-4 py-3 whitespace-nowrap font-semibold">{{ record.name }}</td>
                    <td class="px-4 py-3 text-center">{{ record.present }}</td>
                    <td class="px-4 py-3 text-center">{{ record.sick }}</td>
                    <td class="px-4 py-3 text-center">{{ record.official }}</td>
                    <td class="px-4 py-3 text-center">{{ record.personal }}</td>
                    <td class="px-4 py-3 text-center text-red-600 font-bold">{{ record.absent }}</td>
                    <td class="px-4 py-3 text-center font-medium">
                        <span v-if="calculateAttendanceRate(record) !== null">{{ calculateAttendanceRate(record) }}%</span>
                        <span v-else>N/A</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="bg-gray-100 px-6 py-4 flex justify-end">
            <button @click="isAttendanceSummaryModalOpen = false" type="button" class="btn btn-secondary">關閉</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { authFetch } from '@/utils/api';

// --- State ---
const students = ref([]);
const seatingChart = ref({ rows: 0, cols: 0, seats: {} });
const attendance = ref({});
const performance = ref({});
const isLoading = ref(true);
const error = ref('');

const isScoreModalOpen = ref(false);
const isAttendanceModalOpen = ref(false);
const isPickerModalOpen = ref(false);
const selectedStudentForModal = ref(null);
const tempAttendance = ref({});

const isPicking = ref(false);
const randomlyPickedStudent = ref(null);

const attendanceTypes = {
  present: { label: '出席', color: 'green', bgColor: 'bg-green-500', hoverBg: 'hover:bg-green-200' },
  sick:    { label: '病假', color: 'orange', bgColor: 'bg-orange-500', hoverBg: 'hover:bg-orange-200' },
  official:{ label: '公假', color: 'blue', bgColor: 'bg-blue-500', hoverBg: 'hover:bg-blue-200' },
  personal:{ label: '事假', color: 'yellow', bgColor: 'bg-yellow-500', hoverBg: 'hover:bg-yellow-200' },
  absent:  { label: '曠課', color: 'red', bgColor: 'bg-red-500', hoverBg: 'hover:bg-red-200' },
};

const isAttendanceSummaryModalOpen = ref(false);
const summaryStartDate = ref('');
const summaryEndDate = ref('');
const attendanceSummaryData = ref([]);
const summaryLoading = ref(false);


// --- Computed Properties ---

const today_YYYYMMDD = computed(() => new Date().toISOString().split('T')[0]);
const today_display = computed(() => new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }));

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${seatingChart.value.cols}, 1fr)`,
}));

const totalStudentsInChart = computed(() => Object.values(seatingChart.value.seats).filter(Boolean).length);

const sortedStudentsForModal = computed(() => 
    [...students.value].sort((a,b) => (Number(a.seat_number) || Infinity) - (Number(b.seat_number) || Infinity))
);

const attendanceStats = computed(() => {
    const stats = { present: 0, leave: 0, absent: 0 };
    const studentsInChart = Object.values(seatingChart.value.seats).filter(Boolean);
    if (!studentsInChart.length) return stats;

    studentsInChart.forEach(student => {
        const status = attendance.value[student.student_id];
        if (status === 'present') {
            stats.present++;
        } else if (status === 'absent') {
            stats.absent++;
        } else if (['sick', 'official', 'personal'].includes(status)) {
            stats.leave++;
        } else {
            stats.present++; 
        }
    });
    return stats;
});

const studentScoreForModal = computed(() => {
    if (!selectedStudentForModal.value) return 0;
    return performance.value[selectedStudentForModal.value.student_id] || 0;
});

const studentScoreColor = computed(() => {
    const score = studentScoreForModal.value;
    if (score > 0) return 'text-green-600';
    if (score < 0) return 'text-red-600';
    return 'text-gray-800';
});

// --- Methods ---

const getAttendanceStatus = (studentId) => {
    return attendance.value[studentId] || 'present';
};

const getSeatClasses = (student) => {
    if (!student) return 'bg-slate-100 border-slate-200';
    if (randomlyPickedStudent.value && randomlyPickedStudent.value.id === student.id) {
        return 'ring-4 ring-offset-2 ring-indigo-500 scale-105 shadow-lg z-10 bg-white';
    }
    const status = getAttendanceStatus(student.student_id);
    const type = attendanceTypes[status];

    const opacityClass = status !== 'present' ? ' opacity-50' : '';

    if (type) {
      return `bg-${type.color}-100 hover:bg-${type.color}-200 border-${type.color}-300${opacityClass}`;
    }
    return `bg-slate-200 hover:bg-slate-300 border-slate-400${opacityClass}`;
};

const getPerformanceBadgeClass = (student) => {
    if (!student) return 'bg-slate-800';
    const score = performance.value[student.student_id] || 0;
    if (score > 0) return 'bg-green-600';
    if (score < 0) return 'bg-red-600';
    return 'bg-slate-800';
};

const getAttendanceButtonClass = (studentId, type) => {
    const currentStatus = tempAttendance.value[studentId];
    if (currentStatus === type) {
        return `${attendanceTypes[type].bgColor} text-white`;
    }
    return `bg-slate-200 ${attendanceTypes[type].hoverBg} text-slate-700`;
};

const fetchDashboardData = async () => {
    isLoading.value = true;
    error.value = '';
    try {
        const [statusRes, studentsRes] = await Promise.all([
          authFetch(`/api/classroom-status?date=${today_YYYYMMDD.value}`),
          authFetch('/api/students')
        ]);

        if (!statusRes.ok) throw new Error('無法讀取課堂儀表板資料');
        if (!studentsRes.ok) throw new Error('無法讀取學生列表');
        
        const statusData = await statusRes.json();
        students.value = await studentsRes.json();

        seatingChart.value = statusData.seatingChart || { rows: 6, cols: 5, seats: {} };
        performance.value = statusData.performance || {};

        const fetchedAttendance = statusData.attendance || {};
        const allStudentsOnChart = Object.values(seatingChart.value.seats).filter(Boolean);
        const finalAttendance = {};
        allStudentsOnChart.forEach(student => {
            finalAttendance[student.student_id] = fetchedAttendance[student.student_id] || 'present';
        });
        attendance.value = finalAttendance;

    } catch (err) {
        error.value = `錯誤: ${err.message}`;
    } finally {
        isLoading.value = false;
    }
};

const handleSeatClick = (student) => {
    if (!student) return;
    const isPresent = (attendance.value[student.student_id] || 'present') === 'present';
    if (isPresent) {
        openStudentScoreModal(student);
    }
};

const openStudentScoreModal = (student) => {
    selectedStudentForModal.value = student;
    isScoreModalOpen.value = true;
};

const openAttendanceModal = () => {
    const newTemp = {};
    students.value.forEach(student => {
      newTemp[student.student_id] = attendance.value[student.student_id] || 'present';
    });
    tempAttendance.value = newTemp;
    isAttendanceModalOpen.value = true;
};

const setTempAttendance = (studentId, status) => {
  tempAttendance.value[studentId] = status;
};

const saveAttendanceChanges = async () => {
    const promises = [];
    for (const studentId in tempAttendance.value) {
        if (tempAttendance.value[studentId] !== attendance.value[studentId]) {
            promises.push(authFetch('/api/attendance', {
                method: 'POST',
                body: JSON.stringify({
                    student_id: studentId,
                    date: today_YYYYMMDD.value,
                    status: tempAttendance.value[studentId]
                })
            }));
        }
    }

    if (promises.length === 0) {
      isAttendanceModalOpen.value = false;
      return;
    }

    try {
        await Promise.all(promises);
        attendance.value = { ...tempAttendance.value };
        isAttendanceModalOpen.value = false;
    } catch (err) {
        error.value = '儲存出缺席狀態時發生錯誤。請重新整理頁面。';
    }
};

const addPerformance = async (points) => {
    if (!selectedStudentForModal.value) return;
    const studentId = selectedStudentForModal.value.student_id;

    if (!performance.value[studentId]) {
        performance.value[studentId] = 0;
    }
    performance.value[studentId] += points;

    try {
         await authFetch('/api/performance', {
            method: 'POST',
            body: JSON.stringify({
                student_id: studentId,
                date: today_YYYYMMDD.value,
                points: points
            })
        });
    } catch (err) {
        error.value = '新增表現分數失敗';
        fetchDashboardData();
    }
};

const pickRandomStudent = () => {
    const presentStudentIds = Object.keys(attendance.value).filter(id => attendance.value[id] === 'present');
    const presentStudents = students.value.filter(s => presentStudentIds.includes(s.student_id));
    
    if (presentStudents.length === 0) {
        alert('目前沒有標記為「出席」的學生可以抽籤。');
        return;
    }

    isPicking.value = true;
    randomlyPickedStudent.value = null;

    let picks = 0;
    const interval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * presentStudents.length);
        randomlyPickedStudent.value = presentStudents[randomIndex];
        picks++;
        if (picks > 20) {
            clearInterval(interval);
            isPicking.value = false;
            isPickerModalOpen.value = true;
        }
    }, 100);
};

const closePickerModal = () => {
  isPickerModalOpen.value = false;
  setTimeout(() => {
    randomlyPickedStudent.value = null;
  }, 300);
};

const openAttendanceSummaryModal = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 90);
    summaryEndDate.value = endDate.toISOString().split('T')[0];
    summaryStartDate.value = startDate.toISOString().split('T')[0];
    isAttendanceSummaryModalOpen.value = true;
    fetchAttendanceSummary();
};

const fetchAttendanceSummary = async () => {
    summaryLoading.value = true;
    error.value = '';
    try {
        const response = await authFetch(`/api/attendance-summary?startDate=${summaryStartDate.value}&endDate=${summaryEndDate.value}`);
        if (!response.ok) throw new Error('無法讀取學期統計資料');
        attendanceSummaryData.value = await response.json();
    } catch (err) {
        error.value = err.message;
    } finally {
        summaryLoading.value = false;
    }
};

const calculateAttendanceRate = (record) => {
    const totalDays = record.present + record.sick + record.official + record.personal + record.absent;
    if (totalDays === 0) return null;
    const rate = (record.present / totalDays) * 100;
    return rate.toFixed(1);
};


onMounted(fetchDashboardData);
</script>
