<!-- File Path: /client/src/views/StudentManagementView.vue -->
<template>
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">學生管理</h1>
        <div class="flex space-x-2">
          <button @click="downloadTemplate" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition duration-300">下載範本</button>
          <button @click="triggerFileInput" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-300">匯入 Excel</button>
          <input type="file" ref="fileInput" @change="handleFileUpload" class="hidden" accept=".xlsx, .xls">
          <button @click="openModal()" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300">手動新增學生</button>
        </div>
      </div>
  
      <!-- 訊息提示框 -->
      <div v-if="message.text" class="mb-4 p-4 rounded-md" :class="message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
        {{ message.text }}
      </div>
  
      <div class="bg-white shadow-md rounded-lg">
         <div v-if="loading" class="text-center p-8 text-gray-500">讀取中...</div>
         <div v-else class="overflow-x-auto">
          <table class="min-w-full leading-normal">
            <thead>
              <tr>
                <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">學號</th>
                <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">姓名</th>
                <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">班級</th>
                <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">座號</th>
                <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">性別</th>
                <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">帳號</th>
                <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in students" :key="student.id">
                <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">{{ student.student_id }}</td>
                <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">{{ student.name }}</td>
                <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">{{ student.class || '未設定' }}</td>
                <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">{{ student.seat_number || '未設定' }}</td>
                <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">{{ student.gender || '未設定' }}</td>
                <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">{{ student.account }}</td>
                <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm text-right">
                  <button @click="openModal(student)" class="text-blue-600 hover:text-blue-900 mr-4">編輯</button>
                  <button @click="deleteStudent(student)" class="text-red-600 hover:text-red-900">刪除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
  
      <!-- 新增/編輯 Modal -->
      <div v-if="isModalOpen" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
        <div class="relative mx-auto p-8 border w-full max-w-md shadow-lg rounded-md bg-white">
          <h3 class="text-2xl font-bold mb-6">{{ isEditing ? '編輯學生資料' : '新增學生' }}</h3>
          <form @submit.prevent="handleSubmit">
            <div class="grid grid-cols-2 gap-4">
              <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="student_id">學號*</label>
                <input v-model.number="currentStudent.student_id" id="student_id" type="number" required class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700">
              </div>
              <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="name">姓名*</label>
                <input v-model="currentStudent.name" id="name" type="text" required class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700">
              </div>
               <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="class">班級</label>
                <input v-model="currentStudent.class" id="class" type="text" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700">
              </div>
              <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="seat_number">座號</label>
                <input v-model.number="currentStudent.seat_number" id="seat_number" type="number" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700">
              </div>
               <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="gender">性別</label>
                <select v-model="currentStudent.gender" id="gender" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                  <option value="" disabled>請選擇</option>
                  <option>男</option>
                  <option>女</option>
                </select>
              </div>
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="account">帳號*</label>
              <input v-model="currentStudent.account" id="account" type="text" required class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700">
            </div>
            <div class="mb-6">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="password">密碼 <span v-if="isEditing" class="text-xs text-gray-500">(留空表示不變更)</span></label>
              <input v-model="currentStudent.password" id="password" type="password" :required="!isEditing" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700">
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
  const students = ref([]);
  const isModalOpen = ref(false);
  const isEditing = ref(false);
  const currentStudent = ref({});
  const fileInput = ref(null);
  const message = ref({ text: '', type: 'success' });
  
  const showMessage = (text, type = 'success', duration = 3000) => {
    message.value = { text, type };
    setTimeout(() => { message.value = { text: '', type: 'success' }; }, duration);
  };
  
  const fetchStudents = async () => {
    loading.value = true;
    try {
      const response = await fetch('/api/students');
      if (!response.ok) throw new Error('無法讀取學生列表');
      students.value = await response.json();
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      loading.value = false;
    }
  };
  
  const openModal = (student = null) => {
    if (student) {
      isEditing.value = true;
      currentStudent.value = { ...student, password: '' }; // 編輯時密碼留空
    } else {
      isEditing.value = false;
      currentStudent.value = { student_id: null, name: '', class: '', seat_number: null, gender: '', account: '', password: '' };
    }
    isModalOpen.value = true;
  };
  
  const closeModal = () => {
    isModalOpen.value = false;
  };
  
  const handleSubmit = async () => {
    // 編輯時如果密碼為空，則不發送 password 欄位
    const payload = { ...currentStudent.value };
    if (isEditing.value && !payload.password) {
      delete payload.password;
    }
  
    const url = isEditing.value ? `/api/students/${currentStudent.value.id}` : '/api/students';
    const method = isEditing.value ? 'PUT' : 'POST';
  
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '儲存失敗');
      }
      showMessage(`學生資料已成功${isEditing.value ? '更新' : '新增'}！`, 'success');
      fetchStudents();
      closeModal();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };
  
  const deleteStudent = async (student) => {
    if (!confirm(`確定要刪除學生「${student.name}」嗎？`)) return;
  
    try {
      const response = await fetch(`/api/students/${student.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('刪除失敗');
      showMessage('學生已成功刪除！', 'success');
      fetchStudents();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };
  
  const triggerFileInput = () => {
    fileInput.value.click();
  };
  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      const response = await fetch('/api/students/import', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '匯入失敗');
      showMessage(result.message, 'success', 5000);
      fetchStudents();
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      fileInput.value.value = ''; // 清空 file input
    }
  };
  
  const downloadTemplate = () => {
      // 提醒使用者手動建立範本
      showMessage('請依照欄位：學號, 班級, 座號, 姓名, 性別, 帳號, 密碼 建立您的 Excel 檔案。', 'success', 10000);
  };
  
  onMounted(fetchStudents);
  </script>
  
  