<!-- File Path: /client/src/views/SeatingChartView.vue -->
<template>
    <div>
      <h1 class="text-3xl font-bold mb-6">座位表設定</h1>
  
      <!-- 設定區域 -->
      <div class="bg-white p-6 rounded-lg shadow-md mb-8 flex items-center space-x-6">
        <div>
          <label for="rows" class="block text-sm font-medium text-gray-700">總行數：</label>
          <input type="number" id="rows" v-model.number="layout.rows" @change="generateGrid" min="1" class="mt-1 block w-24 rounded-md border-gray-300 shadow-sm">
        </div>
        <div>
          <label for="cols" class="block text-sm font-medium text-gray-700">總列數：</label>
          <input type="number" id="cols" v-model.number="layout.cols" @change="generateGrid" min="1" class="mt-1 block w-24 rounded-md border-gray-300 shadow-sm">
        </div>
        <button @click="saveLayout" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 self-end">儲存座位表</button>
         <div v-if="message.text" class="self-end text-sm" :class="message.type === 'success' ? 'text-green-600' : 'text-red-600'">
          {{ message.text }}
        </div>
      </div>
  
      <!-- 主內容區域 -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- 未安排學生列表 -->
        <div class="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-bold mb-4">未安排座位學生</h2>
          <div 
            class="space-y-2 h-96 overflow-y-auto p-2 border rounded-md"
            @dragover.prevent @drop="dropOnUnassigned"
          >
            <div 
              v-for="student in unassignedStudents" 
              :key="student.id"
              :draggable="true"
              @dragstart="dragStart(student, -1)"
              class="p-3 bg-gray-100 rounded-md cursor-grab shadow-sm"
            >
              {{ student.name }} ({{ student.student_id }})
            </div>
             <div v-if="unassignedStudents.length === 0" class="text-gray-400 text-center pt-4">所有學生皆已安排座位</div>
          </div>
        </div>
  
        <!-- 座位表網格 -->
        <div class="lg:col-span-3 bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-bold mb-4">教室座位</h2>
          <div class="grid gap-3" :style="{ gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))` }">
            <div
              v-for="(student, index) in layout.grid"
              :key="index"
              class="aspect-w-3 aspect-h-2 border-2 rounded-lg flex items-center justify-center p-2 text-center"
              :class="{ 
                'border-dashed border-gray-300': !student,
                'border-blue-400 bg-blue-50': student,
                'bg-yellow-100 border-yellow-400': isDragOverIndex === index
              }"
              @dragover.prevent="dragOver(index)"
              @dragleave="dragLeave"
              @drop="dropOnGrid(index)"
            >
              <div 
                v-if="student" 
                class="w-full h-full cursor-grab"
                :draggable="true"
                @dragstart="dragStart(student, index)"
              >
                <p class="font-semibold text-sm">{{ student.name }}</p>
                <p class="text-xs text-gray-500">{{ student.student_id }}</p>
              </div>
              <span v-else class="text-gray-400 text-sm">空位</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from 'vue';
  
  const allStudents = ref([]);
  const layout = ref({
    rows: 5,
    cols: 6,
    grid: [],
  });
  const draggedItem = ref(null);
  const isDragOverIndex = ref(null);
  const message = ref({ text: '', type: 'success' });
  
  const showMessage = (text, type = 'success', duration = 3000) => {
    message.value = { text, type };
    setTimeout(() => { message.value = { text: '', type: 'success' }; }, duration);
  };
  
  const unassignedStudents = computed(() => {
    const assignedIds = new Set(layout.value.grid.filter(s => s).map(s => s.id));
    return allStudents.value.filter(s => !assignedIds.has(s.id));
  });
  
  const generateGrid = () => {
    const newSize = layout.value.rows * layout.value.cols;
    const newGrid = Array(newSize).fill(null);
    // 保留舊的佈局中仍在範圍內的學生
    for(let i = 0; i < Math.min(layout.value.grid.length, newGrid.length); i++) {
      newGrid[i] = layout.value.grid[i];
    }
    layout.value.grid = newGrid;
  };
  
  const dragStart = (student, fromIndex) => {
    draggedItem.value = { student, fromIndex };
  };
  
  const dragOver = (index) => {
    if (draggedItem.value) {
      isDragOverIndex.value = index;
    }
  };
  
  const dragLeave = () => {
    isDragOverIndex.value = null;
  };
  
  const dropOnGrid = (toIndex) => {
    if (!draggedItem.value) return;
  
    const { student, fromIndex } = draggedItem.value;
    
    // 目標位置的學生（如果有）
    const targetStudent = layout.value.grid[toIndex];
  
    // 將拖曳的學生放到目標位置
    layout.value.grid[toIndex] = student;
  
    if (fromIndex === -1) {
      // 從未安排列表拖曳過來
      // 如果目標位置有學生，該學生會被移出
    } else {
      // 在網格內交換
      layout.value.grid[fromIndex] = targetStudent;
    }
  
    draggedItem.value = null;
    isDragOverIndex.value = null;
  };
  
  const dropOnUnassigned = () => {
    if (!draggedItem.value || draggedItem.value.fromIndex === -1) return;
    
    const { fromIndex } = draggedItem.value;
    layout.value.grid[fromIndex] = null; // 從網格中移除
    draggedItem.value = null;
  };
  
  const fetchStudentsAndLayout = async () => {
    try {
      const [studentsRes, layoutRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/seating-chart')
      ]);
      if (!studentsRes.ok || !layoutRes.ok) throw new Error('無法讀取資料');
      
      allStudents.value = await studentsRes.json();
      const savedLayout = await layoutRes.json();
      
      // 將 student_id 轉換為完整的 student 物件
      const studentMap = new Map(allStudents.value.map(s => [s.id, s]));
      savedLayout.grid = savedLayout.grid.map(studentId => studentMap.get(studentId) || null);
      
      layout.value = savedLayout;
      
    } catch (error) {
      showMessage(error.message, 'error');
      generateGrid(); // 如果讀取失敗，產生預設網格
    }
  };
  
  const saveLayout = async () => {
    try {
      // 只儲存 student id，而不是整個 student 物件
      const layoutToSave = {
        ...layout.value,
        grid: layout.value.grid.map(student => student ? student.id : null)
      };
      
      const response = await fetch('/api/seating-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(layoutToSave)
      });
      if (!response.ok) throw new Error('儲存失敗');
      showMessage('座位表已成功儲存！', 'success');
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };
  
  
  onMounted(fetchStudentsAndLayout);
  </script>
  