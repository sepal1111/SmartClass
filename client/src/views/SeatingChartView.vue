<!-- File Path: /client/src/views/SeatingChartView.vue -->
<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">座位表設定</h1>
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      <!-- 左側：學生列表與設定 -->
      <div class="lg:col-span-1 bg-white p-4 rounded-lg shadow-md h-full">
        <h2 class="text-xl font-semibold mb-4">學生列表</h2>
        <div class="mb-4">
            <input type="text" v-model="searchTerm" placeholder="搜尋學生..." class="w-full px-3 py-2 border rounded-md">
        </div>
        <div class="max-h-[50vh] overflow-y-auto">
          <div v-for="student in filteredStudents" :key="student.id"
               draggable="true"
               @dragstart="startDrag($event, student)"
               class="p-2 mb-2 border rounded-md cursor-grab bg-gray-100 hover:bg-gray-200">
            {{ student.seat_number }}. {{ student.name }}
          </div>
        </div>
        <hr class="my-4">
        <h2 class="text-xl font-semibold mb-4">版面設定</h2>
        <div class="flex items-center space-x-2 mb-4">
          <label>行:</label>
          <input type="number" v-model.number="rows" min="1" max="20" class="w-16 border rounded-md p-1">
          <label>列:</label>
          <input type="number" v-model.number="cols" min="1" max="20" class="w-16 border rounded-md p-1">
        </div>
         <!-- *** 修改開始：將按鈕放入容器中 *** -->
         <div class="mt-4 space-y-2">
            <button @click="autoArrangeBySeatNumber" type="button" class="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors duration-300">
              依座號自動排列
            </button>
            <button @click="saveSeatingChart" class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-300">
              儲存座位表
            </button>
        </div>
        <!-- *** 修改結束 *** -->
        <p v-if="successMessage" class="text-green-600 mt-2">{{ successMessage }}</p>
        <p v-if="error" class="text-red-600 mt-2">{{ error }}</p>
      </div>

      <!-- 右側：座位表 -->
      <div class="lg:col-span-3 bg-white p-4 rounded-lg shadow-md">
        <div v-if="isLoading" class="text-center">讀取中...</div>
        <div v-else :style="gridStyle" class="grid gap-2">
            <div v-for="i in (rows * cols)" :key="i"
               @drop="onDrop($event, i-1)"
               @dragover.prevent
               @dragenter.prevent
               class="border-2 border-dashed rounded-lg p-2 h-28 flex flex-col justify-center items-center relative"
               :class="{'bg-gray-100': !seats[i-1], 'bg-blue-100': seats[i-1]}">
                
                <div v-if="seats[i-1]" class="text-center">
                    <p class="font-bold">{{ seats[i-1].name }}</p>
                    <p class="text-sm text-gray-600">({{ seats[i-1].student_id }})</p>
                    <button @click="removeStudentFromSeat(i-1)" 
                            class="absolute top-1 right-1 text-red-500 hover:text-red-700 text-xs">
                        移除
                    </button>
                </div>
                 <div v-else class="text-gray-400 text-sm">
                    空位
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

const students = ref([]);
const rows = ref(6);
const cols = ref(5);
const seats = ref({});
const isLoading = ref(true);
const error = ref('');
const successMessage = ref('');
const searchTerm = ref('');

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${cols.value}, 1fr)`,
}));

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
        const [studentsRes, chartRes] = await Promise.all([
            authFetch('/api/students'),
            authFetch('/api/seating-chart')
        ]);

        if (!studentsRes.ok) throw new Error('無法讀取學生列表');
        students.value = await studentsRes.json();
        
        if (!chartRes.ok) throw new Error('無法讀取座位表資料');
        const chartData = await chartRes.json();
        
        rows.value = chartData.rows || 6;
        cols.value = chartData.cols || 5;
        seats.value = chartData.seats || {};

    } catch (err) {
        error.value = err.message;
    } finally {
        isLoading.value = false;
    }
};

const startDrag = (event, student) => {
  event.dataTransfer.dropEffect = 'move';
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('studentId', student.id);
};

const onDrop = (event, seatIndex) => {
  const studentId = parseInt(event.dataTransfer.getData('studentId'), 10);
  const student = students.value.find(s => s.id === studentId);

  if (student) {
    for (const key in seats.value) {
        if (seats.value[key] && seats.value[key].id === studentId) {
            seats.value[key] = null;
        }
    }
    seats.value[seatIndex] = student;
  }
};

const removeStudentFromSeat = (seatIndex) => {
    seats.value[seatIndex] = null;
};

// *** 新增功能：依座號自動排列 ***
const autoArrangeBySeatNumber = () => {
    if (!confirm('確定要依座號自動排列嗎？這將會覆蓋目前的座位表設定。')) {
        return;
    }

    // 1. 依座號排序學生
    const sortedStudents = [...students.value].sort((a, b) => {
        // 將座號轉為數字進行比較，無效座號排到後面
        const seatA = Number(a.seat_number) || Infinity;
        const seatB = Number(b.seat_number) || Infinity;
        return seatA - seatB;
    });

    // 2. 建立新的座位表物件並填入學生
    const newSeats = {};
    const totalSeats = rows.value * cols.value;
    for (let i = 0; i < sortedStudents.length; i++) {
        if (i >= totalSeats) {
            break; // 如果座位已滿，則停止排列
        }
        newSeats[i] = sortedStudents[i];
    }

    // 3. 更新畫面上的座位表
    seats.value = newSeats;

    // 4. 提示使用者
    successMessage.value = '已依座號自動排列完成，請記得儲存。';
    setTimeout(() => successMessage.value = '', 4000);
};


const saveSeatingChart = async () => {
    error.value = '';
    successMessage.value = '';
    try {
        const response = await authFetch('/api/seating-chart', {
            method: 'POST',
            body: JSON.stringify({
                rows: rows.value,
                cols: cols.value,
                seats: seats.value
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '儲存失敗');
        successMessage.value = '座位表已成功儲存！';
        setTimeout(() => successMessage.value = '', 3000);
    } catch (err) {
        error.value = err.message;
    }
};

onMounted(fetchAllData);
</script>
