<!-- File Path: /client/src/views/AssignmentsView.vue -->
<template>
  <div>
    <h1 class="text-4xl font-bold text-slate-800 mb-8">作業管理</h1>

    <div class="card p-8 mb-8">
      <h2 class="text-2xl font-semibold mb-6">{{ isEditing ? '編輯作業' : '新增作業' }}</h2>
      <form @submit.prevent="handleAssignmentSubmit" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="title" class="block text-base font-medium text-slate-700">作業標題</label>
            <input type="text" id="title" v-model="form.title" required class="mt-1 form-input text-lg py-3">
          </div>
          <div>
            <label for="subject" class="block text-base font-medium text-slate-700">科目</label>
            <select id="subject" v-model="form.subject_id" required class="mt-1 form-input text-lg py-3">
              <option :value="null" disabled>-- 請選擇科目 --</option>
              <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
            </select>
          </div>
        </div>
        <div>
          <label for="description" class="block text-base font-medium text-slate-700">作業說明 (選填)</label>
          <textarea id="description" v-model="form.description" rows="3" class="mt-1 form-input text-lg py-3"></textarea>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
                <label for="due_date" class="block text-base font-medium text-slate-700">繳交截止日期 (選填)</label>
                <input type="datetime-local" id="due_date" v-model="form.due_date" class="mt-1 form-input text-lg py-3">
            </div>
            <div class="flex items-center pt-6">
                <input type="checkbox" id="allow_resubmission" v-model="form.allow_resubmission" class="h-5 w-5 text-sky-600 border-gray-300 rounded focus:ring-sky-500">
                <label for="allow_resubmission" class="ml-2 block text-base text-slate-700">允許學生重複上傳</label>
            </div>
        </div>
        <div class="flex items-center justify-end space-x-4 pt-4">
           <button v-if="isEditing" @click="cancelEdit" type="button" class="btn btn-secondary text-base px-6 py-2.5">取消</button>
          <button type="submit" class="btn btn-primary text-base px-6 py-2.5">
            {{ isEditing ? '更新作業' : '建立作業' }}
          </button>
        </div>
      </form>
    </div>
     <p v-if="error" class="text-red-500 mb-4">{{ error }}</p>

    <div class="card p-8">
      <h2 class="text-2xl font-semibold mb-6">現有作業列表</h2>
       <div v-if="isLoading" class="text-center text-slate-500 py-8">讀取中...</div>
      <ul v-else-if="assignments.length > 0" class="space-y-4">
        <li v-for="assignment in assignments" :key="assignment.id" class="p-4 border rounded-lg flex justify-between items-center hover:bg-slate-50 transition-colors">
          <div>
            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-sky-100 text-sky-800">{{ assignment.subject_name }}</span>
            <h3 class="font-bold text-xl mt-2">{{ assignment.title }}</h3>
            <p class="text-sm text-slate-600">{{ assignment.description }}</p>
            <p class="text-xs text-slate-500 mt-2">
              建立於: {{ new Date(assignment.created_at).toLocaleString() }} | 
              截止於: {{ assignment.due_date ? new Date(assignment.due_date).toLocaleString() : '無' }} |
              <span :class="assignment.allow_resubmission ? 'text-green-600' : 'text-red-600'">
                {{ assignment.allow_resubmission ? '允許多次上傳' : '僅限單次上傳' }}
              </span>
            </p>
          </div>
          <div class="flex items-center space-x-3">
            <button @click="openSubmissionsModal(assignment)" class="btn bg-teal-500 hover:bg-teal-600 text-sm">查看繳交</button>
            <button @click="editAssignment(assignment)" class="btn bg-yellow-500 hover:bg-yellow-600 text-sm">編輯</button>
            <button @click="deleteAssignment(assignment.id)" class="btn btn-danger text-sm">刪除</button>
          </div>
        </li>
      </ul>
      <p v-else class="text-slate-500 text-center py-8">目前沒有任何作業。</p>
    </div>

    <!-- Submissions Modal -->
    <div v-if="isSubmissionsModalOpen" class="fixed z-10 inset-0 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen p-4">
            <div class="fixed inset-0 bg-gray-600 bg-opacity-75" @click="closeSubmissionsModal"></div>
            <div class="bg-white rounded-lg shadow-xl transform transition-all w-full max-w-6xl h-[80vh] flex flex-col">
                <div class="p-4 border-b flex justify-between items-center">
                    <h3 class="text-xl font-bold">查看「{{ selectedAssignment.title }}」繳交狀況</h3>
                    <button @click="closeSubmissionsModal" class="text-2xl text-gray-500 hover:text-gray-800">&times;</button>
                </div>
                <div class="flex-grow flex overflow-hidden">
                    <!-- Student List -->
                    <div class="w-1/4 bg-slate-50 border-r overflow-y-auto">
                        <div v-if="submissionsLoading" class="p-4 text-center">讀取中...</div>
                        <ul v-else>
                            <li v-for="student in submissions" :key="student.studentId" @click="selectedStudent = student"
                                class="p-4 cursor-pointer hover:bg-sky-100 flex justify-between items-center"
                                :class="{'bg-sky-200': selectedStudent && selectedStudent.name === student.name}">
                                <div>
                                    <p class="font-semibold">{{ formatSeatNumber(student.seat_number) }}. {{ student.name }}</p>
                                    <p class="text-sm text-slate-500">{{ student.files.length }} 個檔案</p>
                                </div>
                                <span v-if="student.isLate" class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                                    遲交
                                </span>
                            </li>
                        </ul>
                    </div>
                    <!-- File Preview -->
                    <div class="w-3/4 p-6 overflow-y-auto">
                        <div v-if="!selectedStudent" class="flex items-center justify-center h-full text-slate-500">
                            請從左側選擇一位學生以檢視檔案
                        </div>
                        <div v-else>
                            <div class="flex justify-between items-center mb-4">
                                <h4 class="text-lg font-bold">{{ selectedStudent.name }} 的檔案</h4>
                                <div v-if="selectedStudent.isLate" class="px-3 py-1 text-base font-semibold rounded-full bg-red-100 text-red-700 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span>此為補交作業</span>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <a v-for="file in selectedStudent.files" :key="file.name" :href="file.url"
                                   @click="handleFileClick(file, $event)"
                                   :download="getFileType(file.name) === 'other' ? getCleanFileName(file.name) : null"
                                   :target="getFileType(file.name) === 'other' ? '_self' : '_blank'"
                                   class="block border rounded-lg p-2 text-center hover:shadow-md transition-shadow group cursor-pointer">
                                    
                                    <img v-if="getFileType(file.name) === 'image'" :src="file.url" class="w-full h-24 object-cover rounded-md mb-2 bg-slate-100">
                                    
                                    <div v-else class="w-full h-24 bg-slate-100 rounded-md mb-2 flex items-center justify-center relative">
                                        <svg v-if="getFileType(file.name) === 'pdf'" class="h-12 w-12 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /> <polyline points="14 2 14 8 20 8" /> <line x1="16" y1="13" x2="8" y2="13" /> <line x1="16" y1="17" x2="8" y2="17" /> <polyline points="10 9 9 9 8 9" /></svg>
                                        <svg v-else-if="getFileType(file.name) === 'video'" class="h-12 w-12 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <polygon points="23 7 16 12 23 17 23 7" /> <rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                                        <!-- *** 新增：音訊檔案圖示 *** -->
                                        <svg v-else-if="getFileType(file.name) === 'audio'" class="h-12 w-12 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <path d="M9 18V5l12-2v13" /> <circle cx="6" cy="18" r="3" /> <circle cx="18" cy="16" r="3" /></svg>
                                        <svg v-else class="h-12 w-12 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
                                        </svg>

                                        <div v-if="getFileType(file.name) !== 'other'" class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-opacity rounded-md">
                                            <svg class="h-10 w-10 text-white opacity-0 group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /> <circle cx="12" cy="12" r="3" /></svg>
                                        </div>
                                    </div>
                                    <p class="text-xs text-slate-700 truncate">{{ getCleanFileName(file.name) }}</p>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div v-if="isLightboxOpen" class="fixed z-50 inset-0 overflow-y-auto" @click="isLightboxOpen = false">
        <div class="flex items-center justify-center min-h-screen p-4 text-center">
            <div class="fixed inset-0 bg-gray-900 bg-opacity-80 transition-opacity"></div>
            
            <div @click.stop class="inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all my-8 max-w-6xl w-full max-h-[90vh] flex flex-col" role="dialog" aria-modal="true">
                <div class="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h3 class="text-xl font-bold text-slate-800 truncate">{{ lightboxFile ? getCleanFileName(lightboxFile.name) : '' }}</h3>
                    <button @click="isLightboxOpen = false" class="text-4xl text-gray-500 hover:text-gray-800">&times;</button>
                </div>
                <div class="flex-grow p-4 flex items-center justify-center bg-slate-200 overflow-hidden">
                    <template v-if="lightboxFile">
                        <img v-if="getFileType(lightboxFile.name) === 'image'" :src="lightboxFile.url" class="max-w-full max-h-full object-contain">
                        <video v-else-if="getFileType(lightboxFile.name) === 'video'" :src="lightboxFile.url" controls class="max-w-full max-h-full"></video>
                        <!-- *** 新增：音訊播放器 *** -->
                        <audio v-else-if="getFileType(lightboxFile.name) === 'audio'" :src="lightboxFile.url" controls class="w-full"></audio>
                        <iframe v-else-if="getFileType(lightboxFile.name) === 'pdf'" :src="lightboxFile.url" class="w-full h-full border-0"></iframe>
                    </template>
                </div>
            </div>
        </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { authFetch } from '@/utils/api';

const assignments = ref([]);
const subjects = ref([]);
const form = reactive({ title: '', description: '', due_date: '', subject_id: null, allow_resubmission: true });
const isEditing = ref(false);
const editingId = ref(null);
const isLoading = ref(true);
const error = ref('');

const isSubmissionsModalOpen = ref(false);
const selectedAssignment = ref(null);
const submissions = ref([]);
const submissionsLoading = ref(false);
const selectedStudent = ref(null);

const isLightboxOpen = ref(false);
const lightboxFile = ref(null);


const formatSeatNumber = (num) => {
  if (num === null || num === undefined) return '';
  return String(num).padStart(2, '0');
};

const fetchInitialData = async () => {
  isLoading.value = true;
  error.value = '';
  try {
    const [assignmentsRes, subjectsRes] = await Promise.all([
      authFetch('/api/assignments'),
      authFetch('/api/subjects')
    ]);
    if (!assignmentsRes.ok) throw new Error('無法讀取作業列表');
    if (!subjectsRes.ok) throw new Error('無法讀取科目列表');
    assignments.value = await assignmentsRes.json();
    subjects.value = await subjectsRes.json();
  } catch (err) { 
    error.value = `錯誤: ${err.message}`; 
  } finally { 
    isLoading.value = false; 
  }
};

const handleAssignmentSubmit = async () => {
  if (isEditing.value) {
    await updateAssignment();
  } else {
    await createAssignment();
  }
};

const createAssignment = async () => {
    error.value = '';
    try {
        const response = await authFetch('/api/assignments', { method: 'POST', body: JSON.stringify(form) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '建立作業失敗');
        assignments.value.unshift(data);
        Object.assign(form, { title: '', description: '', due_date: '', subject_id: null, allow_resubmission: true }); // Reset form
    } catch (err) { error.value = `錯誤: ${err.message}`; }
};

const updateAssignment = async () => {
    error.value = '';
    try {
        const response = await authFetch(`/api/assignments/${editingId.value}`, { 
            method: 'PUT', 
            body: JSON.stringify(form) 
        });
        const updatedData = await response.json();
        if (!response.ok) throw new Error(updatedData.error || '更新作業失敗');

        const index = assignments.value.findIndex(a => a.id === editingId.value);
        if (index !== -1) {
            assignments.value[index] = updatedData;
        }

        cancelEdit();
    } catch (err) { 
        error.value = `錯誤: ${err.message}`; 
    }
};

const editAssignment = (assignment) => {
  isEditing.value = true;
  editingId.value = assignment.id;
  Object.assign(form, { 
      ...assignment, 
      allow_resubmission: !!assignment.allow_resubmission 
  });
};

const cancelEdit = () => {
  isEditing.value = false;
  editingId.value = null;
  Object.assign(form, { title: '', description: '', due_date: '', subject_id: null, allow_resubmission: true });
};

const deleteAssignment = async (id) => {
  if (!confirm('確定要刪除這個作業嗎？')) return;
  error.value = '';
  try {
      const response = await authFetch(`/api/assignments/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '刪除失敗');
      assignments.value = assignments.value.filter(a => a.id !== id);
  } catch (err) { error.value = `錯誤: ${err.message}`; }
};

const openSubmissionsModal = async (assignment) => {
    selectedAssignment.value = assignment;
    isSubmissionsModalOpen.value = true;
    submissionsLoading.value = true;
    selectedStudent.value = null;
    try {
        const res = await authFetch(`/api/assignments/${assignment.id}/submissions`);
        if (!res.ok) throw new Error('無法讀取繳交列表');
        const data = await res.json();
        data.sort((a, b) => parseInt(a.seat_number, 10) - parseInt(b.seat_number, 10));
        submissions.value = data;
    } catch (err) {
        error.value = `讀取繳交列表時發生錯誤: ${err.message}`;
    } finally {
        submissionsLoading.value = false;
    }
};

const closeSubmissionsModal = () => {
    isSubmissionsModalOpen.value = false;
    selectedAssignment.value = null;
    submissions.value = [];
    selectedStudent.value = null;
};

// *** 修正：加入音訊檔案類型判斷 ***
const getFileType = (fileName) => {
    if (!fileName) return 'other';
    const extension = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
    if (['mp4', 'webm', 'ogv'].includes(extension)) return 'video';
    if (['mp3', 'wav', 'm4a', 'ogg'].includes(extension)) return 'audio';
    if (extension === 'pdf') return 'pdf';
    return 'other';
};

const getCleanFileName = (fileName) => {
    if (!fileName) return '';
    return fileName.split('_').slice(3).join('_');
};

const handleFileClick = (file, event) => {
    const type = getFileType(file.name);
    if (type !== 'other') {
        event.preventDefault(); 
        lightboxFile.value = file;
        isLightboxOpen.value = true;
    }
};


onMounted(fetchInitialData);
</script>

