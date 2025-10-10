<!-- File Path: /client/src/views/StudentDashboardView.vue -->
<template>
  <div class="min-h-screen bg-sky-50 p-4 sm:p-8">
    <div class="max-w-4xl mx-auto">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4">
        <div>
          <h1 class="text-4xl font-bold text-slate-800">學生儀表板</h1>
          <p class="text-xl text-slate-600 mt-2">{{ student.name }} 同學，您好！</p>
        </div>
        <!-- *** 修正：新增「加入搶答競賽」按鈕 *** -->
        <div class="flex items-center space-x-2 mt-4 sm:mt-0">
           <button @click="goToQuizRace" class="btn bg-yellow-500 hover:bg-yellow-600">加入搶答競賽</button>
           <button @click="goToPingPong" class="btn bg-teal-500 hover:bg-teal-600">加入 PingPong</button>
           <button @click="isModalOpen = true" class="btn bg-slate-500 hover:bg-slate-600">修改密碼</button>
          <button @click="logout" class="btn bg-red-500 hover:bg-red-600">登出</button>
        </div>
      </div>

      <div class="space-y-8">
        <h2 class="text-3xl font-semibold text-slate-700">待繳交作業</h2>
        <div v-if="loading" class="text-center text-slate-500 py-10">作業列表讀取中...</div>
        <div v-else-if="assignments.length === 0" class="text-center text-slate-500 bg-white p-10 rounded-lg shadow">目前沒有需要繳交的作業。</div>
        <div v-else class="space-y-6">
          <div v-for="assignment in assignments" :key="assignment.id" class="card p-6">
            <div class="flex flex-col md:flex-row justify-between items-start">
              <div class="mb-4 md:mb-0 flex-1">
                <span class="px-2 py-1 text-xs font-semibold rounded-full bg-sky-100 text-sky-800">{{ assignment.subject_name }}</span>
                <h3 class="text-2xl font-bold text-slate-800 mt-2">{{ assignment.title }}</h3>
                <p class="text-slate-600 mt-2">{{ assignment.description }}</p>
                <p class="text-sm mt-3 font-medium" :class="assignment.due_date ? (new Date(assignment.due_date) < new Date() ? 'text-gray-500' : 'text-red-600') : 'text-green-600'">
                    <span v-if="assignment.due_date">繳交截止：{{ new Date(assignment.due_date).toLocaleString() }}</span>
                    <span v-else>沒有繳交期限</span>
                </p>
              </div>
              <div class="w-full md:w-auto md:ml-6 flex flex-col items-stretch" style="min-width: 150px;">
                <!-- 狀態: 已繳交 / 已補交 -->
                <div v-if="assignment.hasSubmitted" 
                     class="w-full text-center py-3 px-6 text-base flex items-center justify-center gap-2 rounded-md font-bold"
                     :class="assignment.isLate ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{{ assignment.isLate ? '已補交' : '已繳交' }}</span>
                </div>
                
                <!-- 狀態: 未繳交，但可重複上傳 -->
                <button v-if="assignment.hasSubmitted && assignment.allow_resubmission" 
                        @click="triggerFileInput(assignment.id)" 
                        class="w-full mt-2 btn btn-secondary py-3 px-6 text-base flex items-center justify-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5" /><path stroke-linecap="round" stroke-linejoin="round" d="M4 12a8 8 0 018-8v0a8 8 0 018 8v0a8 8 0 01-8 8v0a8 8 0 01-8-8v0z" /></svg>
                    <span>重新上傳</span>
                </button>

                <!-- 狀態: 未繳交 -->
                <div v-if="!assignment.hasSubmitted">
                  <input type="file" @change="handleFileSelect($event, assignment.id)" :id="'file-upload-' + assignment.id" class="hidden" multiple>
                  <button @click="triggerFileInput(assignment.id)" 
                          class="w-full btn py-3 px-6 text-base flex items-center justify-center gap-2"
                          :class="isOverdue(assignment) ? 'btn-danger' : 'btn-primary'">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
                    <span>{{ isOverdue(assignment) ? '請補交作業' : '選擇檔案上傳' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="confirmation.show" class="fixed z-20 inset-0 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen">
          <div class="fixed inset-0 bg-gray-600 bg-opacity-75" @click="cancelUpload"></div>
          <div class="bg-white rounded-lg shadow-xl transform transition-all max-w-lg w-full">
              <div class="p-6">
                  <h3 class="text-xl font-bold mb-4">確認上傳</h3>
                  <p class="mb-2">您確定要將以下 <strong class="text-indigo-600">{{ confirmation.files.length }}</strong> 個檔案上傳至「<strong>{{ confirmation.assignmentTitle }}</strong>」嗎？</p>
                  <ul class="text-sm text-slate-600 bg-slate-50 p-3 rounded-md max-h-40 overflow-y-auto border">
                      <li v-for="file in confirmation.files" :key="file.name" class="truncate">{{ file.name }}</li>
                  </ul>
              </div>
              <div class="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                  <button @click="cancelUpload" class="btn btn-secondary">取消</button>
                  <button @click="proceedWithUpload" class="btn btn-primary">確認上傳</button>
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
                                  <input type="password" v-model="passwordForm.currentPassword" required class="mt-1 form-input">
                              </div>
                              <div>
                                  <label class="block text-sm font-medium text-gray-700">新密碼 (至少 6 個字元)</label>
                                  <input type="password" v-model="passwordForm.newPassword" required class="mt-1 form-input">
                              </div>
                              <div>
                                  <label class="block text-sm font-medium text-gray-700">確認新密碼</label>
                                  <input type="password" v-model="passwordForm.confirmPassword" required class="mt-1 form-input">
                              </div>
                              <p v-if="passwordForm.error" class="text-red-500 text-sm">{{ passwordForm.error }}</p>
                          </div>
                      </div>
                      <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                          <button type="submit" class="btn btn-primary">確認修改</button>
                          <button type="button" @click="closeModal" class="btn btn-secondary sm:ml-3 mt-2 sm:mt-0">取消</button>
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
const message = reactive({ text: '', type: 'success' });
const isModalOpen = ref(false);
const passwordForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '', error: '' });

const confirmation = reactive({
  show: false,
  files: [],
  assignmentId: null,
  assignmentTitle: '',
  fileInputRef: null
});

const isOverdue = (assignment) => {
    return assignment.due_date && new Date(assignment.due_date) < new Date();
};

const showMessage = (text, type = 'success', duration = 5000) => { 
  const el = document.createElement('div');
  el.className = `fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, duration);
};

const logout = () => {
  localStorage.clear();
  window.location.href = '/auth';
};
const goToPingPong = () => { router.push({ name: 'pingpong-student' }); };

// *** 新增：導向搶答競賽頁面的函式 ***
const goToQuizRace = () => { router.push({ name: 'quiz-game-student' }); };

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
  const input = document.getElementById(`file-upload-${assignmentId}`);
  if (input) input.click();
};

const handleFileSelect = (event, assignmentId) => {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;
  
  const assignment = assignments.value.find(a => a.id === assignmentId);
  Object.assign(confirmation, {
    show: true,
    files: files,
    assignmentId: assignmentId,
    assignmentTitle: assignment.title,
    fileInputRef: event.target
  });
};

const cancelUpload = () => {
  if (confirmation.fileInputRef) {
    confirmation.fileInputRef.value = '';
  }
  Object.assign(confirmation, { show: false, files: [], assignmentId: null, assignmentTitle: '', fileInputRef: null });
};

const proceedWithUpload = async () => {
  const formData = new FormData();
  confirmation.files.forEach(file => {
    formData.append('files', file);
  });

  try {
      const response = await authFetch(`/api/student/upload/${confirmation.assignmentId}`, { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '上傳失敗');
      showMessage(result.message, 'success');
      fetchAssignments();
  } catch (error) { 
      showMessage(error.message, 'error'); 
  } finally {
      cancelUpload();
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

