<!-- File Path: /client/src/views/StudentManagementView.vue -->
<template>
    <div>
      <h1 class="text-4xl font-bold text-slate-800 mb-8">學生管理</h1>
  
      <div class="card p-8">
        <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div class="flex gap-4 flex-wrap">
            <button @click="openModal(null)" class="btn btn-primary">
              新增學生
            </button>
            <div>
              <input type="file" ref="fileInput" @change="handleFileSelect" class="hidden" accept=".xlsx, .xls, .csv">
              <button @click="triggerFileUpload" class="btn btn-success">
                從檔案匯入
              </button>
            </div>
            <div>
              <input type="file" ref="photoInput" @change="handlePhotoUpload" multiple class="hidden" accept="image/jpeg, image/png">
              <button @click="triggerPhotoUpload" class="btn bg-orange-500 hover:bg-orange-600">
                上傳學生照片
              </button>
            </div>
          </div>
          <div class="w-full md:w-1/3">
            <input type="text" v-model="searchTerm" placeholder="搜尋姓名、學號、帳號..." class="form-input w-full text-base py-2">
          </div>
        </div>
        
         <p v-if="error" class="text-red-500 mb-4">{{ error }}</p>
         <p v-if="successMessage" class="text-green-500 mb-4">{{ successMessage }}</p>
  
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-slate-50">
              <tr>
                <th @click="sortBy('student_id')" class="table-header cursor-pointer">學號 <span v-if="sortKey === 'student_id'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span></th>
                <th @click="sortBy('name')" class="table-header cursor-pointer">姓名 <span v-if="sortKey === 'name'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span></th>
                <th @click="sortBy('class')" class="table-header cursor-pointer">班級 <span v-if="sortKey === 'class'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span></th>
                <th @click="sortBy('seat_number')" class="table-header cursor-pointer">座號 <span v-if="sortKey === 'seat_number'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span></th>
                <th @click="sortBy('account')" class="table-header cursor-pointer">帳號 <span v-if="sortKey === 'account'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span></th>
                <th class="table-header text-right">操作</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
               <tr v-if="isLoading"><td colspan="6" class="text-center py-4">正在載入學生資料...</td></tr>
                <tr v-else-if="filteredAndSortedStudents.length === 0"><td colspan="6" class="text-center py-4 text-gray-500">找不到符合條件的學生。</td></tr>
              <tr v-for="student in filteredAndSortedStudents" :key="student.id" class="hover:bg-slate-50">
                <td class="table-cell">{{ student.student_id }}</td>
                <td class="table-cell font-medium">{{ student.name }}</td>
                <td class="table-cell">{{ student.class }}</td>
                <td class="table-cell">{{ formatSeatNumber(student.seat_number) }}</td>
                <td class="table-cell">{{ student.account }}</td>
                <td class="table-cell text-right">
                  <button @click.prevent="openModal(student)" class="text-indigo-600 hover:text-indigo-900 font-medium">編輯</button>
                  <button @click.prevent="deleteStudent(student.id)" class="text-red-600 hover:text-red-900 ml-4 font-medium">刪除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
  
      <div v-if="isModalOpen" class="fixed z-10 inset-0 overflow-y-auto">
          <div class="flex items-center justify-center min-h-screen">
              <div class="fixed inset-0 bg-gray-500 opacity-75" @click="isModalOpen = false"></div>
              <div class="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all max-w-lg w-full">
                  <form @submit.prevent="handleSubmit">
                      <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                          <h3 class="text-lg leading-6 font-medium text-gray-900">{{ editingStudent ? '編輯學生' : '新增學生' }}</h3>
                          <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                                  <label class="block text-sm font-medium text-gray-700">學號</label>
                                  <input type="text" v-model="form.student_id" required class="mt-1 form-input">
                              </div>
                              <div>
                                  <label class="block text-sm font-medium text-gray-700">姓名</label>
                                  <input type="text" v-model="form.name" required class="mt-1 form-input">
                              </div>
                               <div>
                                  <label class="block text-sm font-medium text-gray-700">帳號</label>
                                  <input type="text" v-model="form.account" required class="mt-1 form-input">
                              </div>
                              <div>
                                  <label class="block text-sm font-medium text-gray-700">密碼 ({{ editingStudent ? '留空表示不變更' : '必填' }})</label>
                                  <input type="password" v-model="form.password" :required="!editingStudent" class="mt-1 form-input">
                              </div>
                              <div>
                                  <label class="block text-sm font-medium text-gray-700">班級</label>
                                  <input type="text" v-model="form.class" class="mt-1 form-input">
                              </div>
                              <div>
                                  <label class="block text-sm font-medium text-gray-700">座號</label>
                                  <input type="number" v-model="form.seat_number" class="mt-1 form-input">
                              </div>
                               <div class="sm:col-span-2">
                                  <label class="block text-sm font-medium text-gray-700">性別</label>
                                  <input type="text" v-model="form.gender" class="mt-1 form-input">
                              </div>
                               <p v-if="modalError" class="text-red-500 text-sm sm:col-span-2">{{ modalError }}</p>
                          </div>
                      </div>
                      <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                          <button type="submit" class="btn btn-primary w-full sm:w-auto">儲存</button>
                          <button type="button" @click="isModalOpen = false" class="btn btn-secondary mt-2 sm:mt-0 sm:ml-3 w-full sm:w-auto">取消</button>
                      </div>
                  </form>
              </div>
          </div>
      </div>
    </div>
</template>
  
<script setup>
  import { ref, onMounted, computed } from 'vue';
  import { authFetch } from '@/utils/api';
  
  const students = ref([]);
  const isModalOpen = ref(false);
  const editingStudent = ref(null);
  const form = ref({});
  const isLoading = ref(true);
  const error = ref('');
  const successMessage = ref('');
  const modalError = ref('');
  const fileInput = ref(null);
  const photoInput = ref(null);
  
  const searchTerm = ref('');
  const sortKey = ref('seat_number');
  const sortOrder = ref('asc');

  const formatSeatNumber = (num) => {
    if (num === null || num === undefined) return '';
    return String(num).padStart(2, '0');
  };
  
  const filteredAndSortedStudents = computed(() => {
      let result = students.value;
      if (searchTerm.value) {
          const lowerCaseSearch = searchTerm.value.toLowerCase();
          result = result.filter(s =>
              (s.name?.toLowerCase().includes(lowerCaseSearch)) ||
              (s.student_id?.toLowerCase().includes(lowerCaseSearch)) ||
              (s.account?.toLowerCase().includes(lowerCaseSearch))
          );
      }
      if (sortKey.value) {
          result.sort((a, b) => {
              let valA = a[sortKey.value], valB = b[sortKey.value];
              if (sortKey.value === 'seat_number') {
                  valA = Number(valA || Infinity);
                  valB = Number(valB || Infinity);
              }
              if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1;
              if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1;
              return 0;
          });
      }
      return result;
  });
  
  const sortBy = (key) => {
      if (sortKey.value === key) {
          sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
      } else {
          sortKey.value = key;
          sortOrder.value = 'asc';
      }
  };
  
  const fetchStudents = async () => {
      isLoading.value = true;
      error.value = '';
      try {
          const response = await authFetch('/api/students');
          if (!response.ok) throw new Error('無法讀取學生資料');
          students.value = await response.json();
      } catch (err) { error.value = `錯誤: ${err.message}`; } 
      finally { isLoading.value = false; }
  };
  
  const openModal = (student) => {
      modalError.value = '';
      editingStudent.value = student;
      form.value = student ? { ...student, password: '' } : { student_id: '', name: '', class: '', seat_number: '', gender: '', account: '', password: '' };
      isModalOpen.value = true;
  };
  
  const handleSubmit = async () => {
      modalError.value = '';
      const method = editingStudent.value ? 'PUT' : 'POST';
      const url = editingStudent.value ? `/api/students/${editingStudent.value.id}` : '/api/students';
      const payload = { ...form.value };
      if (editingStudent.value && !payload.password) delete payload.password;
      try {
          const response = await authFetch(url, { method, body: JSON.stringify(payload) });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || '儲存失敗');
          await fetchStudents();
          isModalOpen.value = false;
          successMessage.value = `學生資料已成功${editingStudent.value ? '更新' : '新增'}！`;
          setTimeout(() => successMessage.value = '', 3000);
      } catch (err) { modalError.value = err.message; }
  };
  
  const deleteStudent = async (id) => {
      if (!confirm('確定要刪除這位學生嗎？')) return;
      error.value = '';
      try {
          const response = await authFetch(`/api/students/${id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error((await response.json()).error || '刪除失敗');
          students.value = students.value.filter(s => s.id !== id);
          successMessage.value = '學生已成功刪除！';
          setTimeout(() => successMessage.value = '', 3000);
      } catch (err) { error.value = `錯誤: ${err.message}`; }
  };
  
  const triggerFileUpload = () => fileInput.value.click();
  const handleFileSelect = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      error.value = '';
      successMessage.value = '正在上傳並匯入資料...';
      try {
          const response = await authFetch('/api/students/import', { method: 'POST', body: formData });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || '匯入失敗');
          successMessage.value = data.message || '匯入成功！';
          await fetchStudents();
      } catch (err) { error.value = `錯誤: ${err.message}`; successMessage.value = ''; } 
      finally { fileInput.value.value = ''; }
  };
  
  const triggerPhotoUpload = () => photoInput.value.click();
  const handlePhotoUpload = async (event) => {
      const files = event.target.files;
      if (!files.length) return;
      const formData = new FormData();
      for (const file of files) formData.append('photos', file);
      error.value = '';
      successMessage.value = `正在上傳 ${files.length} 張照片...`;
      try {
          const response = await authFetch('/api/students/photos/upload', { method: 'POST', body: formData });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || '照片上傳失敗');
          successMessage.value = data.message || '照片上傳完成！';
          setTimeout(() => successMessage.value = '', 5000);
      } catch (err) { error.value = `錯誤: ${err.message}`; successMessage.value = ''; } 
      finally { photoInput.value.value = ''; }
  };
  
  onMounted(fetchStudents);
</script>

<style scoped>
.table-header {
    @apply px-6 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider;
}
.table-cell {
    @apply px-6 py-4 whitespace-nowrap text-base text-slate-700;
}
</style>

