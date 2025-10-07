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
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-6 p-6 bg-sky-50 border border-sky-200 rounded-lg">
                <div class="md:col-span-2">
                    <label for="startDate" class="block text-sm font-medium text-slate-700 mb-1">開始日期</label>
                    <input type="date" id="startDate" v-model="performanceDateRange.start" class="form-input text-base w-full py-2.5">
                </div>
                <div class="md:col-span-2">
                    <label for="endDate" class="block text-sm font-medium text-slate-700 mb-1">結束日期</label>
                    <input type="date" id="endDate" v-model="performanceDateRange.end" class="form-input text-base w-full py-2.5">
                </div>
                <div class="md:col-span-1">
                    <button @click="fetchPerformanceSummary" class="btn btn-primary w-full text-base py-2.5 px-6 flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" /></svg>
                        <span>查詢</span>
                    </button>
                </div>
            </div>
            
            <div v-if="performanceLoading" class="text-center py-8 text-slate-500">正在讀取統計資料...</div>
            <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                <div v-for="student in performanceSummary" :key="student.id" class="bg-white rounded-xl shadow-md p-4 flex flex-col items-center justify-center space-y-2 transition-transform hover:scale-105 hover:shadow-lg border">
                    <div class="text-sm text-slate-500">{{ student.seat_number }}.</div>
                    <div class="text-xl font-bold text-slate-800 text-center">{{ student.name }}</div>
                    <div class="px-5 py-2 rounded-full text-2xl font-extrabold" :class="{
                        'bg-green-100 text-green-700': student.total_score > 0,
                        'bg-red-100 text-red-700': student.total_score < 0,
                        'bg-slate-100 text-slate-600': student.total_score === 0 || student.total_score === null
                    }">
                        {{ student.total_score }}
                    </div>
                </div>
            </div>
        </div>
      </div>

      <!-- Grade Entry Tab -->
      <div v-if="currentTab === 'grade_entry'">
          <div v-if="!isEditingScores" class="card p-8 max-w-4xl mx-auto">
              <h2 class="text-2xl font-semibold mb-6">登錄新成績</h2>
              <div class="space-y-6">
                  <div>
                      <label class="block text-base font-medium text-slate-700">1. 選擇成績類別</label>
                      <select v-model="form.category" class="mt-1 form-input text-lg py-3">
                          <option disabled value="">-- 請選擇 --</option>
                          <option>平時測驗</option>
                          <option>定期評量</option>
                      </select>
                  </div>
                  <div>
                      <label class="block text-base font-medium text-slate-700">2. 選擇科目</label>
                      <select v-model="form.subject_id" class="mt-1 form-input text-lg py-3">
                          <option :value="null">-- 請選擇 --</option>
                          <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
                      </select>
                  </div>
                  <div>
                      <label class="block text-base font-medium text-slate-700">3. 輸入成績項目名稱</label>
                      <input type="text" v-model="form.name" placeholder="例如: 第一次月考" class="mt-1 form-input text-lg py-3">
                  </div>
                  <div class="text-right">
                      <button @click="handleCreateAndProceed" :disabled="!form.category || !form.subject_id || !form.name" class="btn btn-primary text-lg px-8 py-3">
                          下一步：輸入分數
                      </button>
                  </div>
              </div>
          </div>

          <div v-if="isEditingScores && selectedGradeItem">
              <button @click="handleBackFromEdit" class="text-sky-600 hover:text-sky-800 mb-4">&larr; 返回</button>
              <div class="card p-8">
                <h2 class="text-2xl font-semibold mb-6">{{ selectedGradeItem.subject_name }} - {{ selectedGradeItem.name }} ({{ selectedGradeItem.category }})</h2>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-slate-50"><tr><th class="table-header">座號</th><th class="table-header">姓名</th><th class="table-header">分數</th></tr></thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="(student, index) in grades" :key="student.id" class="hover:bg-slate-50">
                                <td class="table-cell">{{ student.seat_number }}</td>
                                <td class="table-cell font-medium">{{ student.name }}</td>
                                <td class="table-cell">
                                    <input 
                                      type="number" 
                                      v-model="student.score" 
                                      @input="updateGrade(student.student_id, $event.target.value)"
                                      @keydown.enter.prevent="focusNextInput(index)"
                                      :data-index="index"
                                      class="form-input w-32 text-lg py-2 text-center">
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
              </div>
          </div>
      </div>

      <!-- All Grades Overview Tab -->
      <div v-if="currentTab === 'grade_overview'">
          <div class="card p-8">
              <h2 class="text-2xl font-semibold mb-6">成績項目總覽與修改</h2>
              <div class="space-y-8">
                  <div v-for="(items, category) in groupedGradeItems" :key="category">
                      <h3 class="text-xl font-bold text-sky-700 border-b-2 border-sky-200 pb-2 mb-4">{{ category }}</h3>
                      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div v-for="item in items" :key="item.id" @click="jumpToEdit(item)"
                               class="p-4 border rounded-lg cursor-pointer hover:bg-sky-50 hover:shadow-lg transition-all">
                              <p class="font-bold text-lg text-slate-800">{{ item.name }}</p>
                              <p class="text-sm text-slate-500">{{ item.subject_name }}</p>
                              <p class="text-xs text-slate-400 mt-2">{{ new Date(item.date).toLocaleDateString() }}</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  
      <div v-if="currentTab === 'settings'">
          <div class="card p-8">
            <h2 class="text-2xl font-semibold mb-6">科目管理</h2>
            <div class="max-w-xl mx-auto">
                <div class="flex items-center space-x-4 mb-8 p-4 bg-slate-50 rounded-lg border">
                    <input type="text" v-model="newSubjectName" placeholder="新增科目名稱..." class="form-input text-lg flex-grow py-3">
                    <button @click="addSubject" class="btn btn-primary text-base py-3 px-6">新增</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div v-for="subject in subjects" :key="subject.id" class="bg-white rounded-lg shadow border p-4 flex flex-col">
                        <input type="text" v-model="subject.name" @change="updateSubject(subject)" class="form-input text-xl font-bold border-0 text-center p-2 mb-4">
                        <button @click="deleteSubject(subject.id)" class="mt-auto w-full btn btn-danger btn-sm text-xs py-1">刪除</button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
</template>

<script setup>
  import { ref, reactive, onMounted, watch, computed } from 'vue';
  import { authFetch } from '@/utils/api';
  import { debounce } from 'lodash';
  
  const tabs = ref([ 
      { key: 'performance', name: '課堂表現' }, 
      { key: 'grade_entry', name: '登錄新成績' },
      { key: 'grade_overview', name: '總覽與修改成績' },
      { key: 'settings', name: '科目設定' }
  ]);
  const currentTab = ref('performance');
  
  const form = reactive({
      category: '',
      subject_id: null,
      name: '',
      grade_item_id: null
  });
  
  const isEditingScores = ref(false);

  // Data state
  const subjects = ref([]);
  const gradeItems = ref([]);
  const grades = ref([]);
  const performanceSummary = ref([]);
  const performanceLoading = ref(false);
  const performanceDateRange = reactive({ start: '', end: '' });

  const newSubjectName = ref('');
  
  // Computed
  const selectedGradeItem = computed(() => {
      if (!form.grade_item_id) return null;
      return gradeItems.value.find(item => item.id === form.grade_item_id);
  });

  const groupedGradeItems = computed(() => {
      const groups = { '平時測驗': [], '定期評量': [] };
      // Sort items by date descending before grouping
      const sortedItems = [...gradeItems.value].sort((a, b) => new Date(b.date) - new Date(a.date));
      sortedItems.forEach(item => {
          if (groups[item.category]) {
              groups[item.category].push(item);
          }
      });
      return groups;
  });
  
  // Main Methods
  const resetFlow = () => {
      Object.assign(form, { category: '', subject_id: null, name: '', grade_item_id: null });
      grades.value = [];
  };

  const handleCreateAndProceed = async () => {
    const payload = {
        category: form.category,
        subject_id: form.subject_id,
        name: form.name
    };
    try {
        const res = await authFetch('/api/grade-items', { method: 'POST', body: JSON.stringify(payload) });
        const createdItem = await res.json();
        gradeItems.value.unshift(createdItem);
        form.grade_item_id = createdItem.id;
        await fetchGradesFor(createdItem.id);
        isEditingScores.value = true;
    } catch (error) {
        console.error("建立成績項目失敗:", error);
    }
  };

  const handleBackFromEdit = () => {
    isEditingScores.value = false;
    resetFlow();
    if (currentTab.value === 'grade_entry') {
        // Stay on the entry tab, allowing to create another new entry
    } else {
        // If coming from overview, switch back
        currentTab.value = 'grade_overview';
    }
  };

  const jumpToEdit = async (item) => {
    form.grade_item_id = item.id;
    await fetchGradesFor(item.id);
    currentTab.value = 'grade_entry'; // Switch to the entry tab
    isEditingScores.value = true; // Set it to editing mode
  };


  // Data Fetching & Management
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
  const addSubject = async () => { if (!newSubjectName.value) return; const res = await authFetch('/api/subjects', { method: 'POST', body: JSON.stringify({ name: newSubjectName.value }) }); subjects.value.push(await res.json()); newSubjectName.value = ''; };
  const updateSubject = async (subject) => { authFetch(`/api/subjects/${subject.id}`, { method: 'PUT', body: JSON.stringify({ name: subject.name }) }); };
  const deleteSubject = async (id) => { if (!confirm('確定刪除此科目嗎？所有相關的成績項目和分數將會一併刪除！')) return; await authFetch(`/api/subjects/${id}`, { method: 'DELETE' }); subjects.value = subjects.value.filter(s => s.id !== id); gradeItems.value = gradeItems.value.filter(gi => gi.subject_id !== id); };
  
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
  
  const focusNextInput = (currentIndex) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < grades.value.length) {
      const nextInput = document.querySelector(`input[data-index='${nextIndex}']`);
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  };

  // Watchers
  watch(currentTab, (newTab) => {
      if (newTab !== 'grade_entry') {
        isEditingScores.value = false;
        resetFlow();
      }
      if(newTab === 'performance'){
        fetchPerformanceSummary();
      }
  });
</script>

<style scoped>
.table-header {
    @apply px-6 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider;
}
.table-cell {
    @apply px-6 py-4 whitespace-nowrap text-lg text-slate-700;
}
.btn-secondary {
    @apply bg-slate-200 text-slate-700 hover:bg-slate-300;
}
.btn-danger.btn-sm {
    @apply px-3 py-1.5 text-xs;
}
</style>

