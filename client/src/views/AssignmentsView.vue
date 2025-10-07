<!-- File Path: /client/src/views/AssignmentsView.vue -->
<template>
  <div>
    <h1 class="text-4xl font-bold text-slate-800 mb-8">作業管理</h1>

    <div class="card p-8 mb-8">
      <h2 class="text-2xl font-semibold mb-6">{{ isEditing ? '編輯作業' : '新增作業' }}</h2>
      <form @submit.prevent="handleAssignmentSubmit" class="space-y-6">
        <div>
          <label for="title" class="block text-base font-medium text-slate-700">作業標題</label>
          <input type="text" id="title" v-model="newAssignment.title" required class="mt-1 form-input text-lg">
        </div>
        <div>
          <label for="description" class="block text-base font-medium text-slate-700">作業說明</label>
          <textarea id="description" v-model="newAssignment.description" rows="3" class="mt-1 form-input text-lg"></textarea>
        </div>
        <div>
          <label for="due_date" class="block text-base font-medium text-slate-700">繳交截止日期</label>
          <input type="datetime-local" id="due_date" v-model="newAssignment.due_date" class="mt-1 form-input text-lg">
        </div>
        <div class="flex items-center justify-end space-x-4 pt-4">
           <button v-if="isEditing" @click="cancelEdit" type="button" class="btn btn-secondary text-base py-2 px-6">
            取消
          </button>
          <button type="submit" class="btn btn-primary text-base py-2 px-6">
            {{ isEditing ? '更新作業' : '建立作業' }}
          </button>
        </div>
      </form>
    </div>
    
     <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
        <p class="font-bold">發生錯誤：</p>
        <p>{{ error }}</p>
    </div>

    <div class="card p-8">
      <h2 class="text-2xl font-semibold mb-6">現有作業列表</h2>
       <div v-if="isLoading" class="text-center text-slate-500 py-8">讀取中...</div>
      <ul v-else-if="assignments.length > 0" class="space-y-4">
        <li v-for="assignment in assignments" :key="assignment.id" class="p-4 border rounded-lg flex justify-between items-center transition-shadow hover:shadow-md bg-slate-50">
          <div>
            <h3 class="font-bold text-lg text-slate-800">{{ assignment.title }}</h3>
            <p class="text-base text-slate-600 mt-1">{{ assignment.description }}</p>
            <p class="text-sm text-slate-500 mt-2">
              建立於: {{ new Date(assignment.created_at).toLocaleString() }} | 
              截止於: {{ assignment.due_date ? new Date(assignment.due_date).toLocaleString() : '無' }}
            </p>
          </div>
          <div class="space-x-4">
            <button @click="editAssignment(assignment)" class="btn bg-sky-600 hover:bg-sky-700 text-sm">編輯</button>
            <button @click="deleteAssignment(assignment.id)" class="btn btn-danger text-sm">刪除</button>
          </div>
        </li>
      </ul>
      <p v-else class="text-slate-500 text-center py-8">目前沒有任何作業。</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { authFetch } from '@/utils/api';

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
    const response = await authFetch('/api/assignments');
    if (!response.ok) throw new Error('無法讀取作業列表');
    assignments.value = await response.json();
  } catch (err) { error.value = `錯誤: ${err.message}`; } 
  finally { isLoading.value = false; }
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
        const response = await authFetch('/api/assignments', { method: 'POST', body: JSON.stringify(newAssignment.value) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '建立作業失敗');
        assignments.value.unshift(data);
        newAssignment.value = { title: '', description: '', due_date: '' };
    } catch (err) { error.value = `錯誤: ${err.message}`; }
};

const editAssignment = (assignment) => {
  isEditing.value = true;
  editingId.value = assignment.id;
  
  const localDate = new Date(assignment.due_date);
  const correctedDate = new Date(localDate.getTime() - (localDate.getTimezoneOffset() * 60000));
  
  newAssignment.value = { 
    ...assignment,
    due_date: assignment.due_date ? correctedDate.toISOString().slice(0, 16) : ''
  };
};

const updateAssignment = async () => {
    error.value = '';
    try {
        const response = await authFetch(`/api/assignments/${editingId.value}`, {
            method: 'PUT',
            body: JSON.stringify(newAssignment.value),
        });
        const updatedAssignment = await response.json();
        if (!response.ok) throw new Error(updatedAssignment.error || '更新失敗');
        
        const index = assignments.value.findIndex(a => a.id === editingId.value);
        if (index !== -1) {
            assignments.value[index] = updatedAssignment;
        }
        cancelEdit();
    } catch (err) {
        error.value = `錯誤: ${err.message}`;
    }
};


const cancelEdit = () => {
  isEditing.value = false;
  editingId.value = null;
  newAssignment.value = { title: '', description: '', due_date: '' };
};

const deleteAssignment = async (id) => {
  if (!confirm('確定要刪除這個作業嗎？相關的學生上傳檔案夾將不會被刪除。')) return;
  error.value = '';
  try {
      const response = await authFetch(`/api/assignments/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '刪除失敗');
      assignments.value = assignments.value.filter(a => a.id !== id);
  } catch (err) { error.value = `錯誤: ${err.message}`; }
};

onMounted(fetchAssignments);
</script>
