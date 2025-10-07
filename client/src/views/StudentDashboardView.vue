<!-- File Path: /client/src/views/StudentDashboardView.vue -->
<template>
  <div class="min-h-screen bg-sky-50 p-4 sm:p-8 font-sans">
    <div class="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-10">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-slate-200 pb-6">
        <div>
          <h1 class="text-4xl font-bold text-slate-800">學生儀表板</h1>
          <p class="text-xl text-slate-500 mt-2">{{ student.name }} 同學，您好！</p>
        </div>
        <div class="flex items-center space-x-2 mt-4 sm:mt-0">
           <button @click="goToPingPong" class="btn bg-teal-500 hover:bg-teal-600 text-lg px-5 py-3">
              加入 PingPong
          </button>
           <button @click="isModalOpen = true" class="btn btn-secondary text-lg px-5 py-3">
              修改密碼
          </button>
          <button @click="logout" class="btn btn-danger text-lg px-5 py-3">
              登出
          </button>
        </div>
      </div>

      <!-- Message Area -->
      <div v-if="message.text" class="mb-6 p-4 rounded-lg text-lg" :class="message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
        {{ message.text }}
      </div>

      <!-- Assignments Section -->
      <div class="space-y-8">
        <h2 class="text-3xl font-semibold text-slate-700">進行中的作業</h2>
        <div v-if="loading" class="text-center text-slate-500 py-10">
          <p class="text-lg">作業列表讀取中...</p>
        </div>
        <div v-else-if="assignments.length === 0" class="text-center text-slate-500 bg-slate-50 p-10 rounded-lg">
          <p class="text-xl">太棒了！目前沒有需要繳交的作業。</p>
        </div>
        <div v-else class="space-y-6">
          <div v-for="assignment in assignments" :key="assignment.id" class="bg-slate-50 p-6 border border-slate-200 rounded-xl hover:shadow-md transition-shadow duration-300">
            <div class="flex flex-col md:flex-row justify-between items-start">
              <div class="mb-4 md:mb-0 flex-1">
                <h3 class="text-2xl font-bold text-sky-600">{{ assignment.title }}</h3>
                <p class="text-slate-600 mt-2 text-base">{{ assignment.description }}</p>
                <p class="text-base text-red-600 mt-4 font-medium">繳交截止日期：{{ new Date(assignment.due_date).toLocaleString() }}</p>
              </div>
              <div class="w-full md:w-auto md:ml-6">
                <input type="file" @change="handleFileSelect($event, assignment.id)" :id="'file-upload-' + assignment.id" class="hidden">
                <button @click="triggerFileInput(assignment.id)" class="w-full btn btn-primary text-lg py-3 px-6 flex items-center justify-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  <span>選擇檔案上傳</span>
                </button>
                 <p v-if="uploadStatus[assignment.id] && uploadStatus[assignment.id].fileName" class="text-sm text-slate-500 mt-2 truncate">
                   {{ uploadStatus[assignment.id].uploading ? '上傳中...' : '已選取:' }} {{ uploadStatus[assignment.id].fileName }}
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

     <!-- 修改密碼 Modal -->
      <div v-if="isModalOpen" class="fixed z-10 inset-0 overflow-y-auto">
          <div class="flex items-center justify-center min-h-screen p-4">
              <div class="fixed inset-0 bg-black opacity-60" @click="isModalOpen = false"></div>
              <div class="bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all max-w-lg w-full">
                  <form @submit.prevent="changePassword">
                      <div class="bg-white px-4 pt-5 pb-4 sm:p-8">
                          <h3 class="text-2xl leading-6 font-bold text-slate-900">修改密碼</h3>
                          <div class="mt-6 space-y-6">
                              <div>
                                  <label class="block text-base font-medium text-slate-700">目前的密碼</label>
                                  <input type="password" v-model="passwordForm.currentPassword" required class="form-input mt-1 text-lg py-3">
                              </div>
                              <div>
                                  <label class="block text-base font-medium text-slate-700">新密碼 (至少 6 個字元)</label>
                                  <input type="password" v-model="passwordForm.newPassword" required class="form-input mt-1 text-lg py-3">
                              </div>
                              <div>
                                  <label class="block text-base font-medium text-slate-700">確認新密碼</label>
                                  <input type="password" v-model="passwordForm.confirmPassword" required class="form-input mt-1 text-lg py-3">
                              </div>
                              <p v-if="passwordForm.error" class="text-red-500 text-base">{{ passwordForm.error }}</p>
                          </div>
                      </div>
                      <div class="bg-slate-50 px-4 py-4 sm:px-8 sm:flex sm:flex-row-reverse">
                          <button type="submit" class="btn btn-primary w-full sm:w-auto text-lg py-3 px-6">確認修改</button>
                          <button type="button" @click="closeModal" class="btn btn-secondary mt-3 sm:mt-0 w-full sm:w-auto sm:mr-3 text-lg py-3 px-6">取消</button>
                      </div>
                  </form>
              </div>
          </div>
      </div>

    <!-- 上傳確認 Modal -->
    <div v-if="isConfirmModalOpen" class="fixed z-20 inset-0 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen p-4">
            <div class="fixed inset-0 bg-black opacity-60" @click="cancelUpload"></div>
            <div class="bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all max-w-lg w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-8">
                    <div class="sm:flex sm:items-start">
                        <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                            <svg class="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </div>
                        <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 class="text-2xl leading-6 font-bold text-slate-900">確認上傳</h3>
                            <div class="mt-4">
                                <p class="text-base text-slate-600">確定要將檔案「<strong class="text-slate-800">{{ confirmModalInfo.file?.name }}</strong>」上傳至此作業嗎？</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-slate-50 px-4 py-4 sm:px-8 sm:flex sm:flex-row-reverse">
                    <button @click="confirmUpload" type="button" class="btn btn-primary w-full sm:w-auto text-lg py-3 px-6">確定上傳</button>
                    <button @click="cancelUpload" type="button" class="btn btn-secondary mt-3 sm:mt-0 w-full sm:w-auto sm:mr-3 text-lg py-3 px-6">取消</button>
                </div>
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
const message = ref({ text: '', type: 'success' });

// 修改密碼 Modal 狀態
const isModalOpen = ref(false);
const passwordForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '', error: '' });

// 上傳確認 Modal 狀態
const isConfirmModalOpen = ref(false);
const confirmModalInfo = ref({ file: null, assignmentId: null });

// 上傳狀態
const uploadStatus = ref({});

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
  document.getElementById(`file-upload-${assignmentId}`).click();
};

const handleFileSelect = (event, assignmentId) => {
  const file = event.target.files[0];
  if (!file) return;

  confirmModalInfo.value = { file, assignmentId };
  isConfirmModalOpen.value = true;

  // 清空 file input 以便下次能選同一個檔案
  event.target.value = ''; 
};

const cancelUpload = () => {
  isConfirmModalOpen.value = false;
  confirmModalInfo.value = { file: null, assignmentId: null };
}

const confirmUpload = async () => {
    isConfirmModalOpen.value = false;
    const { file, assignmentId } = confirmModalInfo.value;
    if (!file || !assignmentId) return;

    uploadStatus.value[assignmentId] = { fileName: file.name, uploading: true };

    const formData = new FormData();
    formData.append('file', file);

    try {
        // *** 修正API路徑，將 assignmentId 加入 ***
        const response = await authFetch(`/api/student/upload/${assignmentId}`, { method: 'POST', body: formData });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || '上傳失敗');
        showMessage(result.message, 'success');
    } catch (error) { 
        showMessage(error.message, 'error');
    } finally {
        uploadStatus.value[assignmentId] = { fileName: file.name, uploading: false };
        confirmModalInfo.value = { file: null, assignmentId: null };
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
