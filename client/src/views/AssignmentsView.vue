<!-- File Path: /client/src/views/AssignmentsView.vue -->
<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">作業管理</h1>

    <!-- 新增作業表單 -->
    <div class="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 class="text-xl font-semibold mb-4">{{ isEditing ? '編輯作業' : '新增作業' }}</h2>
      <form @submit.prevent="handleAssignmentSubmit" class="space-y-4">
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700">作業標題</label>
          <input type="text" id="title" v-model="newAssignment.title" required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
        </div>
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700">作業說明</label>
          <textarea id="description" v-model="newAssignment.description" rows="3"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
        </div>
        <div>
          <label for="due_date" class="block text-sm font-medium text-gray-700">繳交截止日期</label>
          <input type="datetime-local" id="due_date" v-model="newAssignment.due_date"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
        </div>
        <div class="flex items-center justify-end space-x-4">
           <button v-if="isEditing" @click="cancelEdit" type="button"
            class="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            取消
          </button>
          <button type="submit"
            class="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            {{ isEditing ? '更新作業' : '建立作業' }}
          </button>
        </div>
      </form>
    </div>
     <p v-if="error" class="text-red-500 mb-4">{{ error }}</p>

    <!-- 作業列表 -->
    <div class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-4">現有作業列表</h2>
       <div v-if="isLoading" class="text-center">讀取中...</div>
      <ul v-else-if="assignments.length > 0" class="space-y-4">
        <li v-for="assignment in assignments" :key="assignment.id" class="p-4 border rounded-md flex justify-between items-center">
          <div>
            <h3 class="font-bold">{{ assignment.title }}</h3>
            <p class="text-sm text-gray-600">{{ assignment.description }}</p>
            <p class="text-xs text-gray-500 mt-1">
              建立於: {{ new Date(assignment.created_at).toLocaleString() }} | 
              截止於: {{ assignment.due_date ? new Date(assignment.due_date).toLocaleString() : '無' }}
            </p>
          </div>
          <div class="space-x-2">
            <button @click="editAssignment(assignment)" class="text-blue-500 hover:text-blue-700">編輯</button>
            <button @click="deleteAssignment(assignment.id)" class="text-red-500 hover:text-red-700">刪除</button>
          </div>
        </li>
      </ul>
      <p v-else class="text-gray-500">目前沒有任何作業。</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { authFetch } from '@/utils/api'; // 引入 authFetch

const assignments = ref([]);
const newAssignment = ref({ title: '', description: '', due_date: '' });
const isEditing = ref(false);
const editingId = ref(null);
const isLoading = ref(true);
const error = ref('');

const fetchAssignments = async () => {
  isLoading.value = true;
  error.value = '';
  try {
    const response = await authFetch('/api/assignments'); // 使用 authFetch
    if (!response.ok) throw new Error('無法讀取作業列表');
    assignments.value = await response.json();
  } catch (err) {
    error.value = `錯誤: ${err.message}`;
  } finally {
    isLoading.value = false;
  }
};

const handleAssignmentSubmit = async () => {
  if (isEditing.value) {
    // 編輯邏輯 (若後端有支援)
    console.log("更新作業", editingId.value, newAssignment.value);
    alert('更新功能尚未實作');
  } else {
    // 新增邏輯
    await createAssignment();
  }
};

const createAssignment = async () => {
    error.value = '';
    try {
        const response = await authFetch('/api/assignments', { // 使用 authFetch
            method: 'POST',
            body: JSON.stringify(newAssignment.value)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '建立作業失敗');
        assignments.value.unshift(data); // 將新作業加到列表最前面
        newAssignment.value = { title: '', description: '', due_date: '' }; // 清空表單
    } catch (err) {
        error.value = `錯誤: ${err.message}`;
    }
};


const editAssignment = (assignment) => {
  isEditing.value = true;
  editingId.value = assignment.id;
  newAssignment.value = { ...assignment };
};

const cancelEdit = () => {
  isEditing.value = false;
  editingId.value = null;
  newAssignment.value = { title: '', description: '', due_date: '' };
};

const deleteAssignment = async (id) => {
  if (!confirm('確定要刪除這個作業嗎？相關的學生繳交檔案也會一併刪除。')) return;
  error.value = '';
  try {
      const response = await authFetch(`/api/assignments/${id}`, { method: 'DELETE' }); // 使用 authFetch
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '刪除失敗');
      assignments.value = assignments.value.filter(a => a.id !== id);
  } catch (err) {
      error.value = `錯誤: ${err.message}`;
  }
};

onMounted(fetchAssignments);
</script>

