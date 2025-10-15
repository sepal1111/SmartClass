<!-- File Path: /client/src/views/SeatingChartView.vue -->
<template>
  <div>
    <h1 class="text-4xl font-bold text-slate-800 mb-8">座位表設定</h1>

    <!-- 版面與操作卡片 -->
    <div class="card p-6 mb-8">
      <h2 class="text-2xl font-semibold mb-4">版面與操作</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-slate-50">
        <div>
          <h3 class="text-lg font-medium text-slate-700 mb-2">座位表尺寸</h3>
          <div class="space-y-3">
            <div class="flex items-center">
              <label class="w-1/3 font-medium text-slate-700">行數 (Rows):</label>
              <input type="number" v-model.number="rows" min="1" max="20" class="form-input w-2/3 text-center">
            </div>
            <div class="flex items-center">
              <label class="w-1/3 font-medium text-slate-700">列數 (Cols):</label>
              <input type="number" v-model.number="cols" min="1" max="20" class="form-input w-2/3 text-center">
            </div>
          </div>
        </div>
        <div>
          <h3 class="text-lg font-medium text-slate-700 mb-2">功能按鈕</h3>
          <div class="space-y-3">
            <button @click="autoArrangeBySeatNumber" class="w-full btn btn-success">依座號自動排列</button>
            <button @click="saveSeatingChart" class="w-full btn btn-primary">儲存座位表</button>
          </div>
        </div>
      </div>
      <p v-if="successMessage" class="text-green-600 mt-4 font-semibold">{{ successMessage }}</p>
      <p v-if="error" class="text-red-600 mt-4 font-semibold">{{ error }}</p>
    </div>

    <!-- 學生列表卡片 -->
    <div class="card p-6 mb-8">
      <h2 class="text-2xl font-semibold mb-4">未安排座位學生</h2>
      <div class="mb-4">
          <input type="text" v-model="searchTerm" placeholder="搜尋學生..." class="form-input w-full">
      </div>
      <div class="max-h-[40vh] overflow-y-auto pr-2 border rounded-lg p-2 bg-slate-50">
        <div v-for="student in filteredStudents" :key="student.id"
             draggable="true" @dragstart="startDrag($event, student)"
             class="p-3 mb-2 border rounded-lg cursor-grab bg-white hover:bg-sky-100 transition-colors flex items-center gap-3 shadow-sm">
          <span class="font-bold text-sky-600">{{ formatSeatNumber(student.seat_number) }}</span>
          <span>{{ student.name }}</span>
        </div>
        <div v-if="filteredStudents.length === 0" class="text-center py-10 text-slate-500">
          所有學生皆已安排座位。
        </div>
      </div>
    </div>

    <!-- 下方座位表區塊 -->
    <div class="card p-4">
      <div v-if="isLoading" class="text-center py-10">讀取中...</div>
      <div v-else :style="gridStyle" class="grid gap-4">
          <div v-for="i in (rows * cols)" :key="i"
             @drop="onDrop($event, i-1)" @dragover.prevent @dragenter.prevent
             class="border-2 border-dashed rounded-lg h-36 flex flex-col justify-center items-center relative"
             :class="{'bg-slate-50 hover:border-sky-400': !seats[i-1], 'bg-sky-50 border-sky-200': seats[i-1]}">
              
              <div v-if="seats[i-1]" class="w-full h-full p-2 relative flex flex-col justify-center items-center text-center">
                  <img :src="getPhotoUrl(seats[i-1])" @error="onImageError" class="w-16 h-16 object-cover rounded-full bg-gray-200 mb-2 border-2 border-white shadow">
                  <p class="font-bold truncate text-slate-800">
                    <span class="text-sky-600">{{ formatSeatNumber(seats[i-1].seat_number) }}.</span> {{ seats[i-1].name }}
                  </p>
                  <p class="text-gray-500 text-sm truncate">{{ seats[i-1].account }}</p>
                  <button @click="removeStudentFromSeat(i-1)" class="absolute top-1 right-1 text-red-500 hover:text-red-700 bg-white rounded-full h-6 w-6 flex items-center justify-center shadow">✕</button>
              </div>
               <div v-else class="text-slate-400 text-sm">(空位)</div>
          </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="isConfirmModalOpen" class="fixed z-10 inset-0 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen">
            <div class="fixed inset-0 bg-gray-600 bg-opacity-75" @click="isConfirmModalOpen = false"></div>
            <div class="bg-white rounded-lg shadow-xl transform transition-all max-w-lg w-full">
                <div class="p-6">
                    <div class="flex items-start">
                        <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                            <svg class="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 class="text-lg leading-6 font-medium text-gray-900">
                                確認自動排列
                            </h3>
                            <div class="mt-2">
                                <p class="text-sm text-gray-500">
                                    此操作將會覆蓋目前的座位表，您確定要依座號自動排列嗎？
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button @click="confirmAndArrange" type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-500 text-base font-medium text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:ml-3 sm:w-auto sm:text-sm">
                        確認排列
                    </button>
                    <button @click="isConfirmModalOpen = false" type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">
                        取消
                    </button>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { authFetch } from '@/utils/api';

const students = ref([]);
const rows = ref(6);
const cols = ref(5);
const seats = ref({});
const isLoading = ref(true);
const error = ref('');
const successMessage = ref('');
const searchTerm = ref('');
const studentPhotos = ref(new Set());
const isConfirmModalOpen = ref(false);

const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NkY2RjZCI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MxLjY2IDAgMyAxLjM0IDMgM3MtMS4zNCAzLTMgMy0zLTEuMzQtMy0zIDEuMzQtMyAzLTMzem0wIDE0LjJjLTIuNSAwLTQuNzEtMS4yOC02LTMuMjIuMDMtMS40OSw0LTMuMDggNi0zLjA4czUuOTcgMS4wOSA2IDMuMDhjLTEuMjkgMS45NC0zLjUgMy4yMi02IDMuMjJ6Ii8+PC9zdmc+";

const formatSeatNumber = (num) => {
  if (num === null || num === undefined) return '';
  return String(num).padStart(2, '0');
};

const gridStyle = computed(() => ({ display: 'grid', gridTemplateColumns: `repeat(${cols.value}, 1fr)` }));
const filteredStudents = computed(() => {
    const assignedIds = new Set(Object.values(seats.value).filter(Boolean).map(s => s.id));
    return students.value
        .filter(s => !assignedIds.has(s.id))
        .filter(s => s.name.toLowerCase().includes(searchTerm.value.toLowerCase()));
});

const fetchAllData = async () => {
    isLoading.value = true;
    error.value = '';
    try {
        const [studentsRes, chartRes, photosRes] = await Promise.all([
            authFetch('/api/students'),
            authFetch('/api/seating-chart'),
            authFetch('/api/students/photos')
        ]);
        if (!studentsRes.ok) throw new Error('無法讀取學生列表');
        students.value = await studentsRes.json();
        if (!chartRes.ok) throw new Error('無法讀取座位表資料');
        const chartData = await chartRes.json();
        if (!photosRes.ok) throw new Error('無法讀取學生照片列表');
        studentPhotos.value = new Set(await photosRes.json());
        rows.value = chartData.rows || 6;
        cols.value = chartData.cols || 5;
        seats.value = chartData.seats || {};
    } catch (err) { error.value = err.message; } 
    finally { isLoading.value = false; }
};

const getPhotoUrl = (student) => {
    if (!student?.student_id) return defaultAvatar;
    for (const ext of ['.jpg', '.jpeg', '.png']) {
        if (studentPhotos.value.has(student.student_id + ext)) {
            return `/photos/${student.student_id}${ext}?t=${new Date().getTime()}`;
        }
    }
    return defaultAvatar;
};

const onImageError = (event) => { event.target.src = defaultAvatar; };
const startDrag = (event, student) => { event.dataTransfer.setData('studentId', student.id); };
const onDrop = (event, seatIndex) => {
  const studentId = parseInt(event.dataTransfer.getData('studentId'), 10);
  const student = students.value.find(s => s.id === studentId);
  if (student) {
    for (const key in seats.value) {
        if (seats.value[key]?.id === studentId) seats.value[key] = null;
    }
    seats.value[seatIndex] = student;
  }
};
const removeStudentFromSeat = (seatIndex) => { seats.value[seatIndex] = null; };

const saveSeatingChart = async () => {
    error.value = '';
    successMessage.value = '';
    try {
        const response = await authFetch('/api/seating-chart', { method: 'POST', body: JSON.stringify({ rows: rows.value, cols: cols.value, seats: seats.value }) });
        if (!response.ok) throw new Error((await response.json()).error || '儲存失敗');
        successMessage.value = '座位表已成功儲存！';
        setTimeout(() => successMessage.value = '', 3000);
    } catch (err) { error.value = err.message; }
};

const autoArrangeBySeatNumber = () => {
    isConfirmModalOpen.value = true;
};

const confirmAndArrange = () => {
    const sortedStudents = [...students.value].sort((a, b) => (Number(a.seat_number) || Infinity) - (Number(b.seat_number) || Infinity));
    const newSeats = {};
    for (let i = 0; i < rows.value * cols.value; i++) {
        newSeats[i] = sortedStudents[i] || null;
    }
    seats.value = newSeats;
    isConfirmModalOpen.value = false;
};

onMounted(fetchAllData);
</script>

