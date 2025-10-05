<!-- File Path: /client/src/views/AssignmentsView.vue -->
<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">作業管理</h1>
      <button @click="openModal()" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300">
        新增作業
      </button>
    </div>

    <!-- 訊息提示框 -->
    <div v-if="message.text" class="mb-4 p-4 rounded-md" :class="message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
      {{ message.text }}
    </div>

    <div class="bg-white shadow-md rounded-lg">
      <div v-if="loading" class="text-center p-8 text-gray-500">讀取中...</div>
      <div v-else-if="assignments.length === 0" class="text-center p-8 text-gray-500">尚未建立任何作業</div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full leading-normal">
          <thead>
            <tr>
              <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">標題</th>
              <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">建立日期</th>
              <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">繳交截止日</th>
              <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="assignment in assignments" :key="assignment.id">
              <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                <p class="text-gray-900 whitespace-no-wrap font-bold">{{ assignment.title }}</p>
                <p class="text-gray-600 whitespace-no-wrap mt-1">{{ assignment.description }}</p>
              </td>
              <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">{{ new Date(assignment.created_at).toLocaleDateString() }}</td>
              <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">{{ assignment.due_date || '無' }}</td>
              <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm text-right">
                <button @click="deleteAssignment(assignment)" class="text-red-600 hover:text-red-900">刪除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 新增/編輯 Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div class="relative mx-auto p-8 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <h3 class="text-2xl font-bold mb-6">新增作業</h3>
        <form @submit.prevent="handleSubmit">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="title">作業標題*</label>
            <input v-model="currentAssignment.title" id="title" type="text" required class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700">
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="description">作業說明</label>
            <textarea v-model="currentAssignment.description" id="description" rows="3" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"></textarea>
          </div>
          <div class="mb-6">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="due_date">繳交截止日</label>
            <input v-model="currentAssignment.due_date" id="due_date" type="date" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700">
          </div>
          <div class="flex justify-end space-x-4">
            <button type="button" @click="closeModal" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">取消</button>
            <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">儲存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const loading = ref(true);
const assignments = ref([]);
const isModalOpen = ref(false);
const currentAssignment = ref({});
const message = ref({ text: '', type: 'success' });

const showMessage = (text, type = 'success', duration = 3000) => {
  message.value = { text, type };
  setTimeout(() => { message.value = { text: '', type: 'success' }; }, duration);
};

const fetchAssignments = async () => {
  loading.value = true;
  try {
    const response = await fetch('/api/assignments');
    if (!response.ok) throw new Error('無法讀取作業列表');
    assignments.value = await response.json();
  } catch (error) {
    showMessage(error.message, 'error');
  } finally {
    loading.value = false;
  }
};

const openModal = () => {
  currentAssignment.value = { title: '', description: '', due_date: '' };
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const handleSubmit = async () => {
  try {
    const response = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentAssignment.value)
    });
    if (!response.ok) throw new Error('儲存作業失敗');
    
    await fetchAssignments();
    showMessage('作業已成功新增！', 'success');
    closeModal();
  } catch (error) {
    showMessage(error.message, 'error');
  }
};

const deleteAssignment = async (assignment) => {
  if (!confirm(`確定要刪除作業「${assignment.title}」嗎？這將會刪除所有已繳交的檔案且無法復原。`)) return;

  try {
    const response = await fetch(`/api/assignments/${assignment.id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('刪除作業失敗');
    
    assignments.value = assignments.value.filter(a => a.id !== assignment.id);
    showMessage('作業已成功刪除！', 'success');
  } catch (error) {
    showMessage(error.message, 'error');
  }
};

onMounted(fetchAssignments);
</script>
