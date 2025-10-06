<!-- File Path: /client/src/views/StudentDashboardView.vue -->
<template>
    <div class="min-h-screen bg-gray-100 p-8">
      <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div class="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-800">數位作品繳交</h1>
            <p class="text-lg text-gray-600">{{ student.name }} 同學，您好！</p>
          </div>
          <div class="flex items-center space-x-4">
            <!-- 新增：修改密碼按鈕 -->
            <button @click="openPasswordModal" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition duration-300">
              修改密碼
            </button>
            <button @click="logout" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300">
              登出
            </button>
          </div>
        </div>
  
        <!-- 訊息提示框 -->
        <div v-if="message.text" class="mb-4 p-4 rounded-md" :class="message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
          {{ message.text }}
        </div>
  
        <div class="space-y-6">
          <h2 class="text-2xl font-semibold text-gray-700">進行中的作業</h2>
          <div v-if="loading" class="text-center text-gray-500">
            作業列表讀取中...
          </div>
          <div v-else-if="assignments.length === 0" class="text-center text-gray-500 bg-gray-50 p-6 rounded-lg">
            目前沒有需要繳交的作業。
          </div>
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
                  <button @click="triggerFileInput(assignment.id)" class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300">
                    選擇檔案上傳
                  </button>
                   <p v-if="selectedFiles[assignment.id]" class="text-sm text-gray-500 mt-2 truncate">
                    已選取: {{ selectedFiles[assignment.id].name }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 新增：修改密碼 Modal -->
      <div v-if="isPasswordModalOpen" class="fixed z-10 inset-0 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closePasswordModal"></div>
          <div class="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">修改密碼</h3>
            <form @submit.prevent="handleChangePassword">
              <div class="space-y-4">
                <div>
                  <label for="currentPassword" class="block text-sm font-medium text-gray-700">目前密碼</label>
                  <input type="password" v-model="passwordForm.currentPassword" id="currentPassword" required class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md">
                </div>
                <div>
                  <label for="newPassword" class="block text-sm font-medium text-gray-700">新密碼 (至少6個字元)</label>
                  <input type="password" v-model="passwordForm.newPassword" id="newPassword" required class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md">
                </div>
                <div>
                  <label for="confirmPassword" class="block text-sm font-medium text-gray-700">確認新密碼</label>
                  <input type="password" v-model="passwordForm.confirmPassword" id="confirmPassword" required class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md">
                </div>
                <div v-if="passwordMessage.text" class="p-2 rounded-md text-sm" :class="passwordMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                  {{ passwordMessage.text }}
                </div>
              </div>
              <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button type="submit" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700">
                  儲存變更
                </button>
                <button type="button" @click="closePasswordModal" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0">
                  取消
                </button>
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
  
  const router = useRouter();
  const student = ref({});
  const assignments = ref([]);
  const loading = ref(true);
  const selectedFiles = reactive({});
  const message = ref({ text: '', type: 'success' });
  
  // --- 新增：密碼修改相關狀態 ---
  const isPasswordModalOpen = ref(false);
  const passwordForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const passwordMessage = ref({ text: '', type: 'success' });

  const showMessage = (text, type = 'success', duration = 4000) => {
    message.value = { text, type };
    setTimeout(() => { message.value = { text: '', type: 'success' }; }, duration);
  };
  
  const logout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentInfo');
    router.push({ name: 'auth' });
  };
  
  const fetchAssignments = async () => {
    loading.value = true;
    const token = localStorage.getItem('studentToken');
    try {
      const response = await fetch('/api/student/assignments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('無法讀取作業列表');
      assignments.value = await response.json();
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      loading.value = false;
    }
  };
  
  const triggerFileInput = (assignmentId) => {
    document.getElementById(`file-upload-${assignmentId}`).click();
  };
  
  const handleFileSelect = async (event, assignmentId) => {
    const file = event.target.files[0];
    if (!file) return;
    
    selectedFiles[assignmentId] = file;
    
    if (!confirm(`確定要將檔案「${file.name}」上傳至此作業嗎？`)) {
      selectedFiles[assignmentId] = null;
      event.target.value = '';
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('assignmentId', assignmentId);
  
    const token = localStorage.getItem('studentToken');
    
    try {
      const response = await fetch('/api/student/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '上傳失敗');
      showMessage(result.message, 'success');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      selectedFiles[assignmentId] = null;
      event.target.value = '';
    }
  };

  // --- 新增：密碼修改相關函式 ---
  const openPasswordModal = () => {
    isPasswordModalOpen.value = true;
  };

  const closePasswordModal = () => {
    isPasswordModalOpen.value = false;
    // 清空表單和訊息
    Object.assign(passwordForm, { currentPassword: '', newPassword: '', confirmPassword: '' });
    passwordMessage.value = { text: '', type: 'success' };
  };

  const handleChangePassword = async () => {
    passwordMessage.value = { text: '', type: 'error' };

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      passwordMessage.value = { text: '新密碼與確認密碼不一致。', type: 'error' };
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      passwordMessage.value = { text: '新密碼長度至少需要 6 個字元。', type: 'error' };
      return;
    }

    try {
      const token = localStorage.getItem('studentToken');
      const response = await fetch('/api/student/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      passwordMessage.value = { text: '密碼更新成功！', type: 'success' };
      setTimeout(closePasswordModal, 2000); // 成功後 2 秒自動關閉視窗

    } catch (error) {
      passwordMessage.value = { text: error.message, type: 'error' };
    }
  };
  
  onMounted(() => {
    const studentInfo = localStorage.getItem('studentInfo');
    if (studentInfo) {
      student.value = JSON.parse(studentInfo);
    }
    fetchAssignments();
  });
  </script>
