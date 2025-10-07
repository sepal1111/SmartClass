<!-- File Path: /client/src/views/SeatingChartView.vue -->
<template>
  <div>
    <h1 class="text-4xl font-bold text-slate-800 mb-8">座位表設定</h1>
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      <div class="lg:col-span-1 card h-full flex flex-col">
        <h2 class="text-2xl font-semibold mb-4">學生列表</h2>
        <div class="mb-4">
            <input type="text" v-model="searchTerm" placeholder="搜尋學生..." class="form-input text-base">
        </div>
        <div class="flex-grow overflow-y-auto pr-2 -mr-2">
          <div v-for="student in filteredStudents" :key="student.id"
               draggable="true" @dragstart="startDrag($event, student)"
               class="p-3 mb-2 border rounded-lg cursor-grab bg-slate-100 hover:bg-sky-100 hover:shadow-md transition-all text-lg">
            {{ student.seat_number }}. {{ student.name }}
          </div>
        </div>
        <hr class="my-6">
        <h2 class="text-2xl font-semibold mb-4">版面設定</h2>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-base font-medium text-slate-700">行 (上下)</label>
            <input type="number" v-model.number="rows" min="1" max="20" class="form-input w-full text-lg mt-1">
          </div>
          <div>
            <label class="block text-base font-medium text-slate-700">列 (左右)</label>
            <input type="number" v-model.number="cols" min="1" max="20" class="form-input w-full text-lg mt-1">
          </div>
        </div>
        <button @click="autoArrangeBySeatNumber" class="btn bg-green-500 hover:bg-green-700 w-full py-3 text-base mb-3">
          依座號自動排列
        </button>
         <button @click="saveSeatingChart" class="btn btn-primary w-full py-3 text-base">
          儲存座位表
        </button>
        <p v-if="successMessage" class="text-green-600 mt-3 text-center">{{ successMessage }}</p>
        <p v-if="error" class="text-red-600 mt-3 text-center">{{ error }}</p>
      </div>

      <div class="lg:col-span-3 card p-6">
        <div v-if="isLoading" class="text-center py-16">讀取中...</div>
        <div v-else :style="gridStyle" class="grid gap-4">
            <div v-for="i in (rows * cols)" :key="i"
               @drop="onDrop($event, i-1)" @dragover.prevent @dragenter.prevent
               class="border-2 border-dashed rounded-xl p-2 h-40 flex flex-col justify-center items-center relative transition-colors"
               :class="{'bg-slate-50 hover:bg-sky-50 border-slate-300': !seats[i-1], 'bg-sky-100 border-sky-300': seats[i-1]}">
                
                <div v-if="seats[i-1]" class="w-full h-full p-2 relative flex flex-col items-center justify-center text-center">
                    <img :src="getPhotoUrl(seats[i-1])" @error="onImageError" class="w-20 h-20 object-cover rounded-full bg-slate-200 shadow-md mb-2">
                    <p class="font-bold text-lg truncate text-slate-800">{{ seats[i-1].seat_number }}. {{ seats[i-1].name }}</p>
                    <p class="text-sm text-slate-500 truncate">{{ seats[i-1].account }}</p>
                    <button @click="removeStudentFromSeat(i-1)" class="absolute -top-2 -right-2 text-red-500 bg-white rounded-full p-1 shadow-md hover:bg-red-100 transition-all">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                 <div v-else class="text-slate-400 text-base">拖曳至此</div>
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

const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NkY2RjZCI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MxLjY2IDAgMyAxLjM0IDMgM3MtMS4zNCAzLTMgMy0zLTEuMzQtMy0zIDEuMzQtMyAzLTMzem0wIDE0LjJjLTIuNSAwLTQuNzEtMS4yOC02LTMuMjIuMDMtMS45OSA0LTMuMDggNi0zLjA4czUuOTcgMS4wOSA2IDMuMDhjLTEuMjkgMS45NC0zLjUgMy4yMi02IDMuMjJ6Ii8+PC9zdmc+";

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
        students.value = (await studentsRes.json()).sort((a,b) => (Number(a.seat_number) || Infinity) - (Number(b.seat_number) || Infinity));
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
    // Check if student is already in another seat and clear it
    for (const key in seats.value) {
        if (seats.value[key]?.id === studentId) {
          seats.value[key] = null;
        }
    }
    // Place student in new seat, swapping if necessary
    const occupant = seats.value[seatIndex]; // Student who might be in the target seat
    seats.value[seatIndex] = student;
    if(occupant) { // If there was a student, find them a new home (or put them back in the list)
        const oldSeatIndex = Object.keys(seats.value).find(key => seats.value[key]?.id === student.id);
        if(oldSeatIndex) seats.value[oldSeatIndex] = occupant;
    }
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
    if (!confirm('此操作將會覆蓋目前的座位表，確定要依座號自動排列嗎？')) return;
    const sortedStudents = [...students.value].sort((a, b) => (Number(a.seat_number) || Infinity) - (Number(b.seat_number) || Infinity));
    const newSeats = {};
    for (let i = 0; i < rows.value * cols.value; i++) {
        newSeats[i] = sortedStudents[i] || null;
    }
    seats.value = newSeats;
};

onMounted(fetchAllData);
</script>
