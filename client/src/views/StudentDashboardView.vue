<!-- File Path: /client/src/views/StudentDashboardView.vue -->
<template>
    <div class="min-h-screen bg-gray-100 p-8">
      <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div class="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-800">數位作品繳交</h1>
            <p class="text-lg text-gray-600">{{ student.name }} 同學，您好！</p>
          </div>
          <button @click="logout" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300">
            登出
          </button>
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
                  <p class="text-sm text-red-500 mt-2 font-medium">繳交截止日期：{{ assignment.due_date }}</p>
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
  
  const showMessage = (text, type = 'success', duration = 4000) => {
    message.value = { text, type };
    setTimeout(() => { message.value = { text: '', type: 'success' }; }, duration);
  };
  
  const logout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentInfo');
    router.push({ name: 'student-login' });
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
      event.target.value = ''; // 清空 file input
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
  
  
  onMounted(() => {
    const studentInfo = localStorage.getItem('studentInfo');
    if (studentInfo) {
      student.value = JSON.parse(studentInfo);
    }
    fetchAssignments();
  });
  </script>
  