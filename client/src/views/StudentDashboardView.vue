<!-- File Path: /client/src/views/StudentDashboardView.vue -->
<template>
  <div class="min-h-screen bg-gray-100 p-8">
    <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div class="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-800">學生儀表板</h1>
          <p class="text-lg text-gray-600">{{ student.name }} 同學，您好！</p>
        </div>
        <div class="flex items-center space-x-4">
           <button @click="goToPingPong" class="bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded transition duration-300">
              加入 PingPong
          </button>
           <button @click="isModalOpen = true" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition duration-300">
              修改密碼
          </button>
          <button @click="logout" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300">
              登出
          </button>
        </div>
      </div>

      <div v-if="message.text" class="mb-4 p-4 rounded-md" :class="message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
        {{ message.text }}
      </div>

      <div class="space-y-6">
        <h2 class="text-2xl font-semibold text-gray-700">進行中的作業</h2>
        <div v-if="loading" class="text-center text-gray-500">作業列表讀取中...</div>
        <div v-else-if="assignments.length === 0" class="text-center text-gray-500 bg-gray-50 p-6 rounded-lg">目前沒有需要繳交的作業。</div>
        <div v-else class="space-y-4">
          <div v-for="assignment in assignments" :key="assignment.id" class="p-6 border rounded-lg hover:shadow-md transition-shadow duration-300">
            <div class="flex flex-col md:flex-row justify-between items-start">
              <div class="mb-4 md:mb-0">
                <h3 class="text-xl font-bold text-indigo-600">{{ assignment.title }}</h3>
                <p class="text-gray-600 mt-2">{{ assignment.description }}</p>
                <p class="text-sm text-red-500 mt-2 font-medium">繳交截止日期：{{ new Date(assignment.due_date).toLocaleString() }}</p>
              </div>
              <div class="w-full md:w-auto">
                <input type="file" @change="handleFileSelect($event, assignment.id)" :id="'file-upload-' + assignment.id" class="hidden">
                <button @click="triggerFileInput(assignment.id)" class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300">選擇檔案上傳</button>
                 <p v-if="selectedFile && selectedFile.assignmentId === assignment.id" class="text-sm text-gray-500 mt-2 truncate">已選取: {{ selectedFile.file.name }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

     <!-- 修改密碼 Modal -->
      <div v-if="isModalOpen" class="fixed z-10 inset-0 overflow-y-auto">
          <div class="flex items-center justify-center min-h-screen">
              <div class="fixed inset-0 bg-gray-500 opacity-75" @click="isModalOpen = false"></div>
              <div class="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all max-w-lg w-full">
                  <form @submit.prevent="changePassword">
                      <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                          <h3 class="text-lg leading-6 font-medium text-gray-900">修改密碼</h3>
                          <div class="mt-4 space-y-4">
                              <div>
                                  <label class="block text-sm font-medium text-gray-700">目前的密碼</label>
                                  <input type="password" v-model="passwordForm.currentPassword" required class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                              </div>
                              <div>
                                  <label class="block text-sm font-medium text-gray-700">新密碼 (至少 6 個字元)</label>
                                  <input type="password" v-model="passwordForm.newPassword" required class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                              </div>
                              <div>
                                  <label class="block text-sm font-medium text-gray-700">確認新密碼</label>
                                  <input type="password" v-model="passwordForm.confirmPassword" required class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                              </div>
                              <p v-if="passwordForm.error" class="text-red-500 text-sm">{{ passwordForm.error }}</p>
                          </div>
                      </div>
                      <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                          <button type="submit" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm">確認修改</button>
                          <button type="button" @click="closeModal" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">取消</button>
                      </div>
                  </form>
              </div>
          </div>
      </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { authFetch } from '@/utils/api';

const router = useRouter();
const student = ref(JSON.parse(localStorage.getItem('studentInfo') || '{}'));
const assignments = ref([]);
const loading = ref(true);
const selectedFile = ref(null);
const message = ref({ text: '', type: 'success' });
const isModalOpen = ref(false);
const passwordForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '', error: '' });

const showMessage = (text, type = 'success', duration = 4000) => { message.value = { text, type }; setTimeout(() => { message.value = { text: '', type: 'success' }; }, duration); };
const logout = () => { localStorage.clear(); router.push({ name: 'auth' }); };
const goToPingPong = () => { router.push({ name: 'pingpong-student' }); };

const fetchAssignments = async () => {
  loading.value = true;
  try {
      const response = await authFetch('/api/student/assignments');
      if (!response.ok) throw new Error('無法讀取作業列表');
      assignments.value = await response.json();
  } catch (error) { showMessage(error.message, 'error'); } 
  finally { loading.value = false; }
};

const triggerFileInput = (assignmentId) => {
  selectedFile.value = null; // 清除上一個選擇
  const input = document.getElementById(`file-upload-${assignmentId}`);
  input.onchange = (e) => handleFileSelect(e, assignmentId);
  input.click();
};

const handleFileSelect = async (event, assignmentId) => {
  const file = event.target.files[0];
  if (!file) return;
  selectedFile.value = { file, assignmentId };
  if (!confirm(`確定要將檔案「${file.name}」上傳至此作業嗎？`)) { 
      selectedFile.value = null; 
      event.target.value = ''; // 清空 file input
      return; 
  }
  const formData = new FormData();
  formData.append('file', file);
  try {
      const response = await authFetch('/api/student/upload', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '上傳失敗');
      showMessage(result.message, 'success');
  } catch (error) { showMessage(error.message, 'error'); } 
  finally { 
      selectedFile.value = null; 
      event.target.value = ''; // 清空 file input
  }
};

const closeModal = () => {
  isModalOpen.value = false;
  Object.assign(passwordForm, { currentPassword: '', newPassword: '', confirmPassword: '', error: '' });
};

const changePassword = async () => {
  passwordForm.error = '';
  if (passwordForm.newPassword !== passwordForm.confirmPassword) return passwordForm.error = '新密碼與確認密碼不相符。';
  if (passwordForm.newPassword.length < 6) return passwordForm.error = '新密碼長度至少需要 6 個字元。';
  try {
      const response = await authFetch('/api/student/change-password', {
          method: 'POST',
          body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      showMessage('密碼已成功更新！您無需重新登入。', 'success');
      closeModal();
  } catch (error) { passwordForm.error = error.message; }
};

onMounted(fetchAssignments);
</script>

