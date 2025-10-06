<!-- File Path: /client/src/views/SeatingChartView.vue -->
<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">座位表設定</h1>
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2">
          <label for="rows">行 (Rows):</label>
          <input type="number" id="rows" v-model.number="rows" min="1" class="w-16 p-1 border rounded">
        </div>
        <div class="flex items-center space-x-2">
          <label for="cols">列 (Cols):</label>
          <input type="number" id="cols" v-model.number="cols" min="1" class="w-16 p-1 border rounded">
        </div>
        <button @click="saveSeatingChart" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300">儲存座位表</button>
      </div>
    </div>
     <!-- 訊息提示框 -->
    <div v-if="message.text" class="mb-4 p-4 rounded-md" :class="message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
      {{ message.text }}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <!-- Unseated Students -->
      <div class="md:col-span-1 bg-white p-4 rounded-lg shadow-md">
        <h2 class="text-xl font-bold mb-4 border-b pb-2">未安排座位</h2>
        <div 
          @dragover.prevent 
          @drop="handleDrop($event, 'unseated')"
          class="h-96 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded"
        >
          <div v-if="unseatedStudents.length === 0" class="text-gray-500 text-center pt-4">所有學生皆已安排座位</div>
          <div 
            v-for="student in unseatedStudents" 
            :key="student.id"
            :draggable="true"
            @dragstart="handleDragStart($event, student)"
            class="p-2 bg-white border rounded shadow-sm cursor-grab"
          >
            {{ student.seat_number }}. {{ student.name }}
          </div>
        </div>
      </div>

      <!-- Seating Chart -->
      <div class="md:col-span-3 bg-white p-4 rounded-lg shadow-md">
        <h2 class="text-xl font-bold mb-4 border-b pb-2">教室座位</h2>
         <div 
          class="grid gap-2"
          :style="{ 'grid-template-columns': `repeat(${cols}, minmax(0, 1fr))` }"
        >
          <div 
            v-for="i in rows * cols" 
            :key="i"
            @dragover.prevent
            @drop="handleDrop($event, i-1)"
            class="h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400"
            :class="{ 'bg-blue-50 border-blue-300': seats[i-1] }"
          >
            <div 
              v-if="seats[i-1]"
              :draggable="true"
              @dragstart="handleDragStart($event, seats[i-1])"
              class="w-full h-full p-2 bg-blue-100 rounded text-center text-sm font-semibold text-blue-800 flex flex-col justify-center cursor-grab"
            >
              <span class="text-lg">{{ seats[i-1].name }}</span>
              <span class="text-xs text-gray-600">{{ seats[i-1].student_id }}</span>
            </div>
            <span v-else>{{ i-1 }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';

const students = ref([]);
const rows = ref(6);
const cols = ref(5);
const seats = ref({}); // key: seat index, value: student object
const message = ref({ text: '', type: 'success' });

const showMessage = (text, type = 'success', duration = 3000) => {
  message.value = { text, type };
  setTimeout(() => { message.value = { text: '', type: 'success' }; }, duration);
};

const fetchStudents = async () => {
  try {
    const response = await fetch('/api/students');
    if (!response.ok) throw new Error('無法讀取學生列表');
    students.value = await response.json();
  } catch (error) {
    showMessage(error.message, 'error');
  }
};

const fetchSeatingChart = async () => {
  try {
    const response = await fetch('/api/seating-chart');
    if (!response.ok) throw new Error('無法讀取座位表');
    const data = await response.json();
    rows.value = data.rows || 6;
    cols.value = data.cols || 5;
    seats.value = data.seats || {};
  } catch (error) {
    showMessage(error.message, 'error');
  }
};

const seatedStudentIds = computed(() => {
  return new Set(Object.values(seats.value).filter(Boolean).map(s => s.id));
});

const unseatedStudents = computed(() => {
  return students.value.filter(s => !seatedStudentIds.value.has(s.id));
});

const handleDragStart = (event, student) => {
  event.dataTransfer.setData('studentId', student.id);
  event.dataTransfer.effectAllowed = 'move';
};

const handleDrop = (event, toSeatIndex) => {
  const studentId = parseInt(event.dataTransfer.getData('studentId'), 10);
  if (!studentId) return;

  const draggedStudent = students.value.find(s => s.id === studentId);
  if (!draggedStudent) return;
  
  // Find original seat of the dragged student
  const fromSeatIndex = Object.keys(seats.value).find(key => seats.value[key] && seats.value[key].id === studentId);

  // If dropping in the unseated list
  if (toSeatIndex === 'unseated') {
    if (fromSeatIndex) {
      delete seats.value[fromSeatIndex];
    }
    return;
  }
  
  // Student at the destination seat (if any)
  const targetStudent = seats.value[toSeatIndex];

  // Place dragged student in the new seat
  seats.value[toSeatIndex] = draggedStudent;

  if (fromSeatIndex) {
    // If there was a student at the destination, move them to the original seat
    // Otherwise, clear the original seat
    seats.value[fromSeatIndex] = targetStudent ? targetStudent : null;
    if (!targetStudent) delete seats.value[fromSeatIndex];
  }
};

const saveSeatingChart = async () => {
  try {
    const response = await fetch('/api/seating-chart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: rows.value, cols: cols.value, seats: seats.value })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '儲存失敗');
    showMessage(result.message, 'success');
  } catch (error) {
    showMessage(error.message, 'error');
  }
};

watch([rows, cols], () => {
    // When rows or cols change, we might have seats outside the new bounds.
    // This is a simple cleanup. A more complex one might try to preserve seats.
    const newTotalSeats = rows.value * cols.value;
    Object.keys(seats.value).forEach(key => {
        if (parseInt(key, 10) >= newTotalSeats) {
            delete seats.value[key];
        }
    });
});

onMounted(async () => {
  await fetchStudents();
  await fetchSeatingChart();
});

</script>

