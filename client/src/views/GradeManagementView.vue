<!-- File Path: /client/src/views/GradeManagementView.vue -->
<template>
    <div>
      <h1 class="text-3xl font-bold mb-6">成績管理</h1>
  
      <div class="mb-6 border-b border-gray-200">
          <nav class="-mb-px flex space-x-8" aria-label="Tabs">
              <a v-for="tab in tabs" :key="tab.name" @click="currentTab = tab.key"
                 :class="[currentTab === tab.key ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300', 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm cursor-pointer']">
                  {{ tab.name }}
              </a>
          </nav>
      </div>
  
      <!-- 成績登錄 -->
      <div v-if="currentTab === 'entry'">
         <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg bg-gray-50">
              <div>
                  <label class="block text-sm font-medium text-gray-700">1. 選擇成績類別</label>
                  <select v-model="filter.category" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                      <option value="平時測驗">平時測驗</option>
                      <option value="定期評量">定期評量</option>
                  </select>
              </div>
               <div>
                  <label class="block text-sm font-medium text-gray-700">2. 選擇科目</label>
                  <select v-model="filter.subject_id" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                      <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
                  </select>
              </div>
              <div>
                  <label class="block text-sm font-medium text-gray-700">3. 選擇或建立成績項目</label>
                   <select v-model="selectedGradeItemId" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                      <option :value="null" disabled>-- 請選擇 --</option>
                      <option value="new">建立新成績項目...</option>
                      <option v-for="item in filteredGradeItems" :key="item.id" :value="item.id">{{ item.name }}</option>
                  </select>
              </div>
         </div>
         
         <!-- 建立新成績項目 -->
         <div v-if="isCreatingNewItem" class="flex items-end gap-2 mb-6 p-4 border rounded-lg bg-yellow-50">
              <div class="flex-grow">
                  <label class="block text-sm font-medium text-gray-700">新項目名稱</label>
                  <input type="text" v-model="newGradeItemName" placeholder="例如: 第一次月考"
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              </div>
              <button @click="createGradeItem" :disabled="!newGradeItemName" class="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400">建立</button>
         </div>
  
         <!-- 成績輸入表格 -->
         <div v-if="selectedGradeItem" class="bg-white p-6 rounded-lg shadow-md">
              <div class="flex justify-between items-center mb-4">
                  <h2 class="text-xl font-semibold">{{ selectedGradeItem.subject_name }} - {{ selectedGradeItem.name }} ({{ selectedGradeItem.category }})</h2>
                  <button @click="deleteGradeItem(selectedGradeItem.id)" class="text-red-500 hover:text-red-700 text-sm">刪除此項目</button>
              </div>
               <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left">座號</th><th class="px-6 py-3 text-left">姓名</th><th class="px-6 py-3 text-left">分數</th></tr></thead>
                      <tbody class="bg-white divide-y divide-gray-200">
                          <tr v-for="student in grades" :key="student.id">
                              <td class="px-6 py-4">{{ student.seat_number }}</td>
                              <td class="px-6 py-4">{{ student.name }}</td>
                              <td class="px-6 py-4">
                                  <input type="number" v-model="student.score" @input="updateGrade(student.student_id, $event.target.value)"
                                      class="w-24 border-gray-300 bg-blue-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                              </td>
                          </tr>
                      </tbody>
                  </table>
              </div>
         </div>
      </div>
  
      <!-- 課堂表現 -->
      <div v-if="currentTab === 'performance'" class="bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold mb-4">課堂表現總分 (唯讀)</h2>
          <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left">座號</th><th class="px-6 py-3 text-left">姓名</th><th class="px-6 py-3 text-left">總分</th></tr></thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                      <tr v-for="student in performanceSummary" :key="student.id">
                          <td class="px-6 py-4">{{ student.seat_number }}</td>
                          <td class="px-6 py-4">{{ student.name }}</td>
                          <td class="px-6 py-4 font-bold" :class="student.total_score > 0 ? 'text-green-600' : student.total_score < 0 ? 'text-red-600' : 'text-gray-700'">{{ student.total_score }}</td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </div>
  
      <!-- 成績設定 (科目) -->
      <div v-if="currentTab === 'settings'" class="bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold mb-4">科目管理</h2>
          <div class="flex items-center space-x-2 mb-4">
              <input type="text" v-model="newSubjectName" placeholder="新增科目名稱..."
                  class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <button @click="addSubject" class="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">新增</button>
          </div>
          <ul class="space-y-2">
              <li v-for="subject in subjects" :key="subject.id" class="flex justify-between items-center p-2 border rounded-md">
                  <input type="text" v-model="subject.name" @change="updateSubject(subject)" class="border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  <button @click="deleteSubject(subject.id)" class="text-red-500 hover:text-red-700">刪除</button>
              </li>
          </ul>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted, watch, computed } from 'vue';
  import { authFetch } from '@/utils/api';
  import { debounce } from 'lodash';
  
  const tabs = ref([ { key: 'entry', name: '成績登錄' }, { key: 'performance', name: '課堂表現紀錄' }, { key: 'settings', name: '成績設定' }]);
  const currentTab = ref('entry');
  
  // 狀態
  const subjects = ref([]);
  const gradeItems = ref([]);
  const grades = ref([]);
  const performanceSummary = ref([]);
  
  // 篩選與選擇
  const filter = reactive({ category: '平時測驗', subject_id: null });
  const selectedGradeItemId = ref(null);
  const isCreatingNewItem = ref(false);
  const newGradeItemName = ref('');
  
  // 計算屬性
  const filteredGradeItems = computed(() => {
      if (!filter.subject_id) return [];
      return gradeItems.value.filter(item => item.category === filter.category && item.subject_id === filter.subject_id);
  });
  const selectedGradeItem = computed(() => {
      if (!selectedGradeItemId.value || selectedGradeItemId.value === 'new') return null;
      return gradeItems.value.find(item => item.id === selectedGradeItemId.value);
  });
  
  
  // 初始資料載入
  const fetchData = async () => {
      try {
          const [subjectsRes, gradeItemsRes, performanceRes] = await Promise.all([
              authFetch('/api/subjects'),
              authFetch('/api/grade-items'),
              authFetch('/api/performance-summary')
          ]);
          subjects.value = await subjectsRes.json();
          gradeItems.value = await gradeItemsRes.json();
          performanceSummary.value = await performanceRes.json();
          if (subjects.value.length > 0 && !filter.subject_id) {
              filter.subject_id = subjects.value[0].id;
          }
      } catch (error) { console.error("讀取資料失敗:", error); }
  };
  
  onMounted(fetchData);
  
  // 科目管理
  const newSubjectName = ref('');
  const addSubject = async () => { if (!newSubjectName.value) return; const res = await authFetch('/api/subjects', { method: 'POST', body: JSON.stringify({ name: newSubjectName.value }) }); subjects.value.push(await res.json()); newSubjectName.value = ''; };
  const updateSubject = async (subject) => { authFetch(`/api/subjects/${subject.id}`, { method: 'PUT', body: JSON.stringify({ name: subject.name }) }); };
  const deleteSubject = async (id) => { if (!confirm('確定刪除此科目嗎？')) return; await authFetch(`/api/subjects/${id}`, { method: 'DELETE' }); subjects.value = subjects.value.filter(s => s.id !== id); };
  
  // 成績項目管理
  const createGradeItem = async () => {
      const payload = {
          category: filter.category,
          subject_id: filter.subject_id,
          name: newGradeItemName.value
      };
      const res = await authFetch('/api/grade-items', { method: 'POST', body: JSON.stringify(payload) });
      const createdItem = await res.json();
      gradeItems.value.unshift(createdItem);
      isCreatingNewItem.value = false;
      newGradeItemName.value = '';
      selectedGradeItemId.value = createdItem.id;
  };
  const deleteGradeItem = async (id) => { if (!confirm('確定刪除此成績項目及其所有分數嗎？')) return; await authFetch(`/api/grade-items/${id}`, { method: 'DELETE' }); gradeItems.value = gradeItems.value.filter(item => item.id !== id); if (selectedGradeItemId.value === id) selectedGradeItemId.value = null; };
  
  // 分數管理
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
  
  // 監聽器
  watch(selectedGradeItemId, (newId) => {
      if (newId === 'new') {
          isCreatingNewItem.value = true;
      } else {
          isCreatingNewItem.value = false;
          if (newId) {
              fetchGradesFor(newId);
          } else {
              grades.value = [];
          }
      }
  });
  
  watch([() => filter.category, () => filter.subject_id], () => {
      selectedGradeItemId.value = null; // 重置選擇
  });
  </script>
  
  