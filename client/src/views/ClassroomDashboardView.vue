<!-- File Path: /client/src/views/ClassroomDashboardView.vue -->
<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">班級儀表板</h1>

    <!-- 頂部資訊卡 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      <!-- 出缺席狀況 -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="flex justify-between items-start">
          <h2 class="text-lg font-semibold text-gray-700">今日出缺席 ({{ today_display }})</h2>
          <button @click="openAttendanceModal" class="bg-purple-500 text-white px-3 py-1 rounded-md text-sm hover:bg-purple-600 transition-colors">批次登記</button>
        </div>
        <div v-if="isLoading" class="mt-2">讀取中...</div>
        <div v-else class="mt-4 grid grid-cols-3 gap-2 text-center">
          <div>
            <p class="text-2xl font-bold text-green-600">{{ attendanceStats.present }}</p>
            <p class="text-sm text-gray-500">出席</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-orange-500">{{ attendanceStats.leave }}</p>
            <p class="text-sm text-gray-500">請假</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-red-600">{{ attendanceStats.absent }}</p>
            <p class="text-sm text-gray-500">曠課</p>
          </div>
        </div>
      </div>

      <!-- 隨機抽籤 -->
      <div class="bg-white p-6 rounded-lg shadow-md flex flex-col">
        <h2 class="text-lg font-semibold text-gray-700">隨機抽籤</h2>
        <div class="flex-grow flex flex-col items-center justify-center mt-2">
            <button @click="pickRandomStudent" class="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-colors" :disabled="isPicking">
                {{ isPicking ? '抽籤中...' : '開始抽籤' }}
            </button>
            <p class="mt-3 text-sm h-8 text-gray-400">點擊按鈕從出席學生中抽籤</p>
        </div>
      </div>
       <!-- 總學生數 -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-lg font-semibold text-gray-700">座位表學生總數</h2>
        <p v-if="isLoading" class="text-2xl font-bold mt-2">讀取中...</p>
        <p v-else class="text-3xl font-bold mt-2 text-center pt-3">{{ totalStudentsInChart }} 人</p>
      </div>
    </div>
    
    <!-- 錯誤提示 -->
    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong class="font-bold">發生錯誤：</strong>
        <span class="block sm:inline">{{ error }}</span>
    </div>

    <!-- 互動式座位表 -->
    <div class="bg-white p-4 rounded-lg shadow-md">
        <div v-if="isLoading" class="text-center py-10">座位表讀取中...</div>
        <div v-else :style="gridStyle" class="grid gap-2">
            <div v-for="i in (seatingChart.rows * seatingChart.cols)" :key="i"
                 class="h-28 rounded-lg flex justify-center items-center text-center p-1 transition-all duration-300"
                 :class="getSeatClasses(seatingChart.seats[i-1])">
                
                <div v-if="seatingChart.seats[i-1]" 
                     @click="handleSeatClick(seatingChart.seats[i-1])" 
                     class="w-full h-full flex flex-col justify-between p-1 relative"
                     :class="(attendance[seatingChart.seats[i-1].student_id] || 'present') === 'present' ? 'cursor-pointer' : 'cursor-not-allowed'">
                    <div class="absolute top-1 right-1 rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold text-white" :class="getPerformanceBadgeClass(seatingChart.seats[i-1])">
                      {{ performance[seatingChart.seats[i-1].student_id] || 0 }}
                    </div>
                    <div class="flex-grow flex items-center justify-center">
                      <p class="font-bold text-base leading-tight">{{ seatingChart.seats[i-1].name }}</p>
                    </div>
                    <p class="text-xs text-gray-600">({{ seatingChart.seats[i-1].seat_number }})</p>
                </div>
                 <div v-else class="text-gray-400 text-sm">
                    (空位)
                </div>
            </div>
        </div>
    </div>

    <!-- 學生加減分 Modal -->
    <div v-if="isScoreModalOpen" class="fixed z-20 inset-0 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen">
            <div class="fixed inset-0 transition-opacity" aria-hidden="true" @click="isScoreModalOpen = false">
                <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div class="inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all my-8 max-w-xs w-full">
                <div class="bg-white p-6">
                    <h3 class="text-xl leading-6 font-bold text-gray-900 text-center mb-2">
                        {{ selectedStudentForModal.name }}
                    </h3>
                    
                    <div class="my-4 text-center">
                        <p class="text-sm font-medium text-gray-500">本日累計分數</p>
                        <p class="text-6xl font-bold" :class="studentScoreColor">{{ studentScoreForModal }}</p>
                    </div>

                    <div>
                        <h4 class="font-semibold text-center mt-6">調整分數</h4>
                        <div class="grid grid-cols-2 gap-2 mt-2">
                            <button @click="addPerformance(1)" class="px-4 py-3 text-lg font-bold rounded-md bg-blue-500 text-white hover:bg-blue-600">+1 分</button>
                            <button @click="addPerformance(-1)" class="px-4 py-3 text-lg font-bold rounded-md bg-yellow-500 text-white hover:bg-yellow-600">-1 分</button>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 text-right">
                    <button @click="isScoreModalOpen = false" type="button" class="rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white font-medium text-gray-700 hover:bg-gray-50">關閉</button>
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
        <div class="inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all my-8 max-w-4xl w-full">
          <div class="bg-white px-6 pt-5 pb-4">
            <h3 class="text-2xl font-bold text-gray-900 mb-4">批次登記今日出缺席</h3>
            <div class="max-h-[60vh] overflow-y-auto pr-4">
              <div v-for="student in sortedStudentsForModal" :key="student.id" class="grid grid-cols-6 gap-2 items-center mb-2 p-2 rounded-md hover:bg-gray-50">
                <div class="col-span-1 font-semibold">{{ student.seat_number }}. {{ student.name }}</div>
                <div class="col-span-5 grid grid-cols-5 gap-2">
                  <button v-for="type in Object.keys(attendanceTypes)" :key="type" @click="setTempAttendance(student.student_id, type)"
                          class="px-2 py-1 text-sm rounded-md transition-colors"
                          :class="getAttendanceButtonClass(student.student_id, type)">
                    {{ attendanceTypes[type].label }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-100 px-6 py-3 flex justify-end space-x-4">
            <button @click="isAttendanceModalOpen = false" type="button" class="rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white font-medium text-gray-700 hover:bg-gray-50">取消</button>
            <button @click="saveAttendanceChanges" type="button" class="rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 font-medium text-white hover:bg-purple-700">儲存變更</button>
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
                    <p class="text-lg font-medium text-indigo-600">恭喜！抽中了...</p>
                    <p class="text-6xl sm:text-7xl font-extrabold text-gray-900 my-4">{{ randomlyPickedStudent.name }}</p>
                    <p class="text-2xl text-gray-500 font-semibold">{{ randomlyPickedStudent.seat_number }} 號</p>
                    <div class="mt-8">
                        <button @click="closePickerModal" type="button" class="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-105">
                            關閉
                        </button>
                    </div>
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

// --- Computed Properties ---

const today_YYYYMMDD = computed(() => new Date().toISOString().split('T')[0]);
const today_display = computed(() => new Date().toLocaleDateString());

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
            stats.present++; // Default not-recorded to present
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

const getSeatClasses = (student) => {
    if (!student) return 'bg-gray-100';
    if (randomlyPickedStudent.value && randomlyPickedStudent.value.id === student.id) {
        return 'ring-4 ring-offset-2 ring-indigo-500 scale-105 shadow-lg';
    }
    const status = attendance.value[student.student_id] || 'present';
    const type = attendanceTypes[status];

    const opacityClass = status !== 'present' ? ' opacity-50' : '';

    if (type) {
      return `bg-${type.color}-100 hover:bg-${type.color}-200 border-2 border-${type.color}-300${opacityClass}`;
    }
    return `bg-gray-200 hover:bg-gray-300 border-2 border-gray-400${opacityClass}`;
};

const getPerformanceBadgeClass = (student) => {
    if (!student) return 'bg-gray-800';
    const score = performance.value[student.student_id] || 0;
    if (score > 0) return 'bg-green-600';
    if (score < 0) return 'bg-red-600';
    return 'bg-gray-800';
};

const getAttendanceButtonClass = (studentId, type) => {
    const currentStatus = tempAttendance.value[studentId];
    if (currentStatus === type) {
        return `${attendanceTypes[type].bgColor} text-white`;
    }
    return `bg-gray-200 ${attendanceTypes[type].hoverBg}`;
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

onMounted(fetchDashboardData);
</script>

