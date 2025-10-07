<!-- File Path: /client/src/views/GradeManagementView.vue -->
<template>
    <div>
      <h1 class="text-4xl font-bold text-slate-800 mb-8">成績管理</h1>
  
      <div class="mb-8 border-b border-gray-200">
          <nav class="-mb-px flex space-x-8" aria-label="Tabs">
              <a v-for="tab in tabs" :key="tab.key" @click="currentTab = tab.key"
                 :class="[currentTab === tab.key ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300', 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg cursor-pointer']">
                  {{ tab.name }}
              </a>
          </nav>
      </div>

      <!-- Tab Content -->
      <div v-if="currentTab === 'performance'">
        <div class="card p-8">
            <h2 class="text-2xl font-semibold mb-6">課堂表現區間統計</h2>
            <div class="flex items-center space-x-4 mb-6 p-4 bg-slate-100 rounded-md">
                <label for="startDate" class="text-base font-medium">開始日期:</label>
                <input type="date" id="startDate" v-model="performanceDateRange.start" class="form-input text-base">
                <label for="endDate" class="text-base font-medium">結束日期:</label>
                <input type="date" id="endDate" v-model="performanceDateRange.end" class="form-input text-base">
                <button @click="fetchPerformanceSummary" class="btn btn-primary text-base py-2 px-6">查詢</button>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-slate-50"><tr><th class="table-header">座號</th><th class="table-header">姓名</th><th class="table-header">區間總分</th></tr></thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                      <tr v-if="performanceLoading" ><td colspan="3" class="text-center py-8 text-slate-500">正在讀取統計資料...</td></tr>
                      <tr v-for="student in performanceSummary" :key="student.id" class="hover:bg-slate-50">
                          <td class="table-cell">{{ student.seat_number }}</td>
                          <td class="table-cell font-medium">{{ student.name }}</td>
                          <td class="table-cell text-xl font-bold" :class="student.total_score > 0 ? 'text-green-600' : student.total_score < 0 ? 'text-red-600' : 'text-slate-700'">{{ student.total_score }}</td>
                      </tr>
                  </tbody>
              </table>
          </div>
        </div>
      </div>

      <div v-if="currentTab === 'quiz' || currentTab === 'assessment'">
        <div class="flex space-x-4 mb-6">
            <button @click="gradeMode = 'edit'" :class="['btn text-lg px-8 py-3', gradeMode === 'edit' ? 'btn-primary' : 'btn-secondary']">登錄/修改成績</button>
            <button @click="gradeMode = 'manage'" :class="['btn text-lg px-8 py-3', gradeMode === 'manage' ? 'btn-primary' : 'btn-secondary']">管理成績項目</button>
        </div>

        <!-- Mode: Edit/Enter Grades -->
        <div v-if="gradeMode === 'edit'">
            <div class="card grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6">
                <div>
                  <label class="block text-base font-medium text-slate-700">1. 選擇科目</label>
                  <select v-model="filter.subject_id" class="mt-1 form-input text-lg py-3">
                      <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
                  </select>
                </div>
                <div>
                    <label class="block text-base font-medium text-slate-700">2. 選擇成績項目</label>
                    <select v-model="selectedGradeItemId" class="mt-1 form-input text-lg py-3">
                        <option :value="null">-- 請先選擇科目 --</option>
                        <option v-for="item in filteredGradeItems" :key="item.id" :value="item.id">{{ item.name }}</option>
                    </select>
                </div>
            </div>
            
            <div v-if="selectedGradeItem" class="card p-8">
              <h2 class="text-2xl font-semibold mb-6">{{ selectedGradeItem.subject_name }} - {{ selectedGradeItem.name }} ({{ selectedGradeItem.category }})</h2>
               <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-slate-50"><tr><th class="table-header">座號</th><th class="table-header">姓名</th><th class="table-header">分數</th></tr></thead>
                      <tbody class="bg-white divide-y divide-gray-200">
                          <tr v-for="student in grades" :key="student.id" class="hover:bg-slate-50">
                              <td class="table-cell">{{ student.seat_number }}</td>
                              <td class="table-cell font-medium">{{ student.name }}</td>
                              <td class="table-cell">
                                  <input type="number" v-model="student.score" @input="updateGrade(student.student_id, $event.target.value)"
                                      class="form-input w-32 text-lg py-2 text-center">
                              </td>
                          </tr>
                      </tbody>
                  </table>
              </div>
            </div>
        </div>

        <!-- Mode: Manage Grade Items -->
        <div v-if="gradeMode === 'manage'">
            <div class="card p-8 max-w-3xl mx-auto">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label class="block text-base font-medium text-slate-700">1. 選擇科目</label>
                        <select v-model="filter.subject_id" class="mt-1 form-input text-lg py-3">
                           <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
                        </select>
                    </div>
                    <div class="flex items-end gap-4">
                        <div class="flex-grow">
                            <label class="block text-base font-medium text-slate-700">2. 新增項目名稱</label>
                            <input type="text" v-model="newGradeItemName" placeholder="例如: 第一次月考" class="mt-1 form-input text-lg py-3">
                        </div>
                        <button @click="createGradeItem" :disabled="!newGradeItemName || !filter.subject_id" class="btn btn-primary h-14 text-base px-6">建立</button>
                    </div>
                </div>

                <h3 class="text-xl font-semibold mb-4">現有項目</h3>
                <ul class="space-y-3">
                    <li v-for="item in filteredGradeItems" :key="item.id" class="flex justify-between items-center p-3 border rounded-lg bg-slate-50">
                        <span class="font-medium text-lg">{{ item.name }}</span>
                        <button @click="deleteGradeItem(item.id)" class="btn btn-danger text-sm">刪除</button>
                    </li>
                    <li v-if="!filter.subject_id" class="text-center text-slate-500 py-4">請先選擇科目。</li>
                    <li v-else-if="filteredGradeItems.length === 0" class="text-center text-slate-500 py-4">此科目尚無成績項目。</li>
                </ul>
            </div>
        </div>
      </div>
  
      <div v-if="currentTab === 'settings'">
          <div class="card p-8 max-w-2xl mx-auto">
            <h2 class="text-2xl font-semibold mb-6">科目管理</h2>
            <div class="flex items-center space-x-4 mb-6">
                <input type="text" v-model="newSubjectName" placeholder="新增科目名稱..." class="form-input text-lg flex-grow py-3">
                <button @click="addSubject" class="btn btn-primary text-base py-3 px-6">新增</button>
            </div>
            <ul class="space-y-3">
                <li v-for="subject in subjects" :key="subject.id" class="flex justify-between items-center p-3 border rounded-lg bg-slate-50">
                    <input type="text" v-model="subject.name" @change="updateSubject(subject)" class="form-input text-lg font-medium border-0 bg-transparent">
                    <button @click="deleteSubject(subject.id)" class="btn btn-danger text-sm">刪除</button>
                </li>
            </ul>
        </div>
      </div>
    </div>
</template>

<script setup>
  import { ref, reactive, onMounted, watch, computed } from 'vue';
  import { authFetch } from '@/utils/api';
  import { debounce } from 'lodash';
  
  const tabs = ref([ 
      { key: 'performance', name: '課堂表現統計' }, 
      { key: 'quiz', name: '平時測驗' }, 
      { key: 'assessment', name: '定期評量' }, 
      { key: 'settings', name: '科目設定' }
  ]);
  const currentTab = ref('performance');
  const gradeMode = ref('edit'); // 'edit' or 'manage'
  
  // State
  const subjects = ref([]);
  const gradeItems = ref([]);
  const grades = ref([]);
  const performanceSummary = ref([]);
  const performanceLoading = ref(false);
  
  const performanceDateRange = reactive({ start: '', end: '' });

  const filter = reactive({ subject_id: null });
  const selectedGradeItemId = ref(null);
  const newGradeItemName = ref('');
  
  // Computed
  const currentCategory = computed(() => {
    if (currentTab.value === 'quiz') return '平時測驗';
    if (currentTab.value === 'assessment') return '定期評量';
    return '';
  });

  const filteredGradeItems = computed(() => {
      if (!filter.subject_id || !currentCategory.value) return [];
      return gradeItems.value.filter(item => item.category === currentCategory.value && item.subject_id === filter.subject_id);
  });
  
  const selectedGradeItem = computed(() => {
      if (!selectedGradeItemId.value) return null;
      return gradeItems.value.find(item => item.id === selectedGradeItemId.value);
  });
  
  // Methods
  const setDefaultDates = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    performanceDateRange.end = endDate.toISOString().split('T')[0];
    performanceDateRange.start = startDate.toISOString().split('T')[0];
  };

  const fetchInitialData = async () => {
      try {
          const [subjectsRes, gradeItemsRes] = await Promise.all([
              authFetch('/api/subjects'),
              authFetch('/api/grade-items'),
          ]);
          subjects.value = await subjectsRes.json();
          gradeItems.value = await gradeItemsRes.json();
          if (subjects.value.length > 0 && !filter.subject_id) {
              filter.subject_id = subjects.value[0].id;
          }
          await fetchPerformanceSummary();
      } catch (error) { console.error("讀取初始資料失敗:", error); }
  };

  const fetchPerformanceSummary = async () => {
    performanceLoading.value = true;
    try {
        const res = await authFetch(`/api/performance-summary?startDate=${performanceDateRange.start}&endDate=${performanceDateRange.end}`);
        performanceSummary.value = await res.json();
    } catch (error) {
        console.error("讀取表現統計失敗:", error);
    } finally {
        performanceLoading.value = false;
    }
  };

  onMounted(() => {
    setDefaultDates();
    fetchInitialData();
  });
  
  // Subject Management
  const newSubjectName = ref('');
  const addSubject = async () => { if (!newSubjectName.value) return; const res = await authFetch('/api/subjects', { method: 'POST', body: JSON.stringify({ name: newSubjectName.value }) }); subjects.value.push(await res.json()); newSubjectName.value = ''; };
  const updateSubject = async (subject) => { authFetch(`/api/subjects/${subject.id}`, { method: 'PUT', body: JSON.stringify({ name: subject.name }) }); };
  const deleteSubject = async (id) => { if (!confirm('確定刪除此科目嗎？所有相關的成績項目和分數將會一併刪除！')) return; await authFetch(`/api/subjects/${id}`, { method: 'DELETE' }); subjects.value = subjects.value.filter(s => s.id !== id); gradeItems.value = gradeItems.value.filter(gi => gi.subject_id !== id); };
  
  // Grade Item Management
  const createGradeItem = async () => {
      const payload = {
          category: currentCategory.value,
          subject_id: filter.subject_id,
          name: newGradeItemName.value
      };
      const res = await authFetch('/api/grade-items', { method: 'POST', body: JSON.stringify(payload) });
      const createdItem = await res.json();
      gradeItems.value.unshift(createdItem);
      newGradeItemName.value = '';
      selectedGradeItemId.value = createdItem.id;
      gradeMode.value = 'edit'; // Switch back to edit mode
  };
  const deleteGradeItem = async (id) => { if (!confirm('確定刪除此成績項目及其所有分數嗎？')) return; await authFetch(`/api/grade-items/${id}`, { method: 'DELETE' }); gradeItems.value = gradeItems.value.filter(item => item.id !== id); if (selectedGradeItemId.value === id) selectedGradeItemId.value = null; };
  
  // Grade Entry
  const fetchGradesFor = async (itemId) => {
      const res = await authFetch(`/api/grades/${itemId}`);
      grades.value = await res.json();
  };
  const debouncedSave = debounce((student_id, score) => {
      if (!selectedGradeItem.value) return;
      authFetch('/api/grades', {
          method: 'POST',
          body: JSON.stringify({ grade_item_id: selectedGradeItem.value.id, student_id, score }),
      });
  }, 500);
  const updateGrade = (student_id, score) => {
      debouncedSave(student_id, score);
  };
  
  // Watchers
  watch(selectedGradeItemId, (newId) => {
      if (newId) {
        fetchGradesFor(newId);
      } else {
        grades.value = [];
      }
  });
  
  watch(currentTab, (newTab) => {
      selectedGradeItemId.value = null;
      gradeMode.value = 'edit';
      if(newTab === 'performance' && performanceSummary.value.length === 0){
        fetchPerformanceSummary();
      }
  });

   watch(filter, () => {
      selectedGradeItemId.value = null;
  });
</script>

<style scoped>
.table-header {
    @apply px-6 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider;
}
.table-cell {
    @apply px-6 py-4 whitespace-nowrap text-lg text-slate-700;
}
</style>

