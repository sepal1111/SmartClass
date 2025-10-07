<!-- File Path: /client/src/views/QuizManagerView.vue -->
<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl font-bold text-slate-800">搶答競賽 (QuizRace)</h1>
      <button @click="openSetModal(null)" class="btn btn-primary">建立新測驗集</button>
    </div>

    <div v-if="loading" class="text-center py-10 text-slate-500">正在載入題庫...</div>
    <div v-else-if="quizSets.length === 0" class="text-center bg-white rounded-lg p-12 shadow">
      <h3 class="text-2xl font-semibold text-slate-700">尚未建立任何測驗集</h3>
      <p class="text-slate-500 mt-2">點擊右上角的「建立新測驗集」來開始吧！</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="set in quizSets" :key="set.id" class="card flex flex-col">
        <div class="flex-grow">
          <span v-if="set.subject_name" class="px-2 py-1 text-xs font-semibold rounded-full bg-sky-100 text-sky-800">{{ set.subject_name }}</span>
          <h3 class="text-2xl font-bold text-slate-800 mt-2">{{ set.title }}</h3>
          <p class="text-sm text-slate-500 mt-2">建立於: {{ new Date(set.created_at).toLocaleDateString() }}</p>
        </div>
        <div class="mt-6 grid grid-cols-2 gap-3">
          <button @click="openQuestionsModal(set)" class="btn bg-slate-600 hover:bg-slate-700 w-full">管理題目</button>
          <router-link :to="{ name: 'quiz-game-teacher', params: { setId: set.id } }" class="btn btn-success w-full text-center">開始競賽</router-link>
        </div>
         <div class="mt-3 flex justify-end items-center text-sm">
            <button @click="openSetModal(set)" class="text-blue-500 hover:text-blue-700 font-medium">編輯資訊</button>
            <span class="mx-2 text-slate-300">|</span>
            <button @click="deleteSet(set.id)" class="text-red-500 hover:text-red-700 font-medium">刪除</button>
        </div>
      </div>
    </div>

    <!-- 測驗集 Modal -->
    <div v-if="isSetModalOpen" class="fixed z-10 inset-0 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen">
            <div class="fixed inset-0 bg-gray-600 bg-opacity-75" @click="isSetModalOpen = false"></div>
            <form @submit.prevent="saveSet" class="bg-white rounded-lg shadow-xl transform transition-all max-w-lg w-full">
                <div class="p-6">
                    <h3 class="text-xl font-bold mb-4">{{ currentSet.id ? '編輯測驗集' : '建立新測驗集' }}</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700">測驗集標題</label>
                            <input type="text" v-model="currentSet.title" required class="mt-1 form-input">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700">關聯科目 (選填)</label>
                            <select v-model="currentSet.subject_id" class="mt-1 form-input">
                                <option :value="null">-- 無 --</option>
                                <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                    <button type="button" @click="isSetModalOpen = false" class="btn btn-secondary">取消</button>
                    <button type="submit" class="btn btn-primary">儲存</button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- 題目管理 Modal -->
    <div v-if="isQuestionsModalOpen && selectedSet" class="fixed z-20 inset-0 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="fixed inset-0 bg-gray-800 bg-opacity-80" @click="closeQuestionsModal"></div>
        <div class="bg-white rounded-lg shadow-xl transform transition-all w-full max-w-5xl h-[90vh] flex flex-col">
          <div class="p-4 border-b flex justify-between items-center">
              <h3 class="text-2xl font-bold">管理題目: {{ selectedSet.title }}</h3>
              <button @click="closeQuestionsModal" class="text-3xl text-gray-500 hover:text-gray-800">&times;</button>
          </div>
          <div class="flex-grow p-6 overflow-y-auto">
            <div class="flex justify-end items-center gap-4 mb-6">
              <input type="file" ref="quizFileInput" @change="handleQuizImport" class="hidden" accept=".xlsx, .xls, .csv">
              <button @click="triggerQuizImport" class="btn bg-emerald-500 hover:bg-emerald-600">匯入題庫</button>
              <button @click="openQuestionModal(null)" class="btn btn-primary">新增題目</button>
            </div>
             <div v-if="questions.length === 0" class="text-center text-slate-500 py-10">
                <p>這個測驗集還沒有題目喔！</p>
             </div>
             <div v-else class="space-y-4">
                <div v-for="(question, index) in questions" :key="question.id" class="border rounded-lg p-4 bg-slate-50">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-bold text-lg">{{ index + 1 }}. <span v-html="question.question_text || '無題目文字'"></span></p>
                            <div class="grid grid-cols-2 gap-x-8 gap-y-2 mt-2 pl-6">
                                <div v-for="(opt, i) in question.options" :key="i" class="flex items-center" :class="{'font-bold text-green-600': opt.isCorrect}">
                                  {{ opt.text }} <svg v-if="opt.isCorrect" class="w-5 h-5 ml-1 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                           <button @click="openQuestionModal(question)" class="btn bg-yellow-500 hover:bg-yellow-600 text-sm">編輯</button>
                           <button @click="deleteQuestion(question.id)" class="btn btn-danger text-sm">刪除</button>
                        </div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/編輯題目 Modal -->
    <div v-if="isQuestionModalOpen" class="fixed z-30 inset-0 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen">
            <div class="fixed inset-0 bg-gray-900 bg-opacity-50" @click="isQuestionModalOpen = false"></div>
            <form @submit.prevent="saveQuestion" class="bg-white rounded-lg shadow-xl transform transition-all max-w-2xl w-full">
                <div class="p-6">
                    <h3 class="text-xl font-bold mb-4">{{ currentQuestion.id ? '編輯題目' : '新增題目' }}</h3>
                    <div class="space-y-4">
                        <div>
                           <label class="block text-sm font-medium text-slate-700">題目內容 (可留空)</label>
                           <div ref="questionEditor" contenteditable="true" v-html="currentQuestion.question_text" class="mt-1 w-full min-h-[100px] p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400"></div>
                        </div>
                         <div>
                            <label class="block text-sm font-medium text-slate-700">選項 (至少2個，最多4個)</label>
                            <div v-for="(option, index) in currentQuestion.options" :key="index" class="flex items-center mt-2 gap-2">
                                <input type="text" v-model="option.text" class="form-input flex-grow" required>
                                <label class="flex items-center gap-1.5">
                                    <input type="radio" :name="'correct-option-' + currentQuestion.id" :value="index" @change="setCorrectOption(index)" :checked="option.isCorrect">
                                    正確
                                </label>
                                <button type="button" @click="removeOption(index)" v-if="currentQuestion.options.length > 2" class="text-red-500">&times;</button>
                            </div>
                            <button type="button" @click="addOption" v-if="currentQuestion.options.length < 4" class="text-sm text-sky-600 mt-2">新增選項</button>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700">作答時間 (秒)</label>
                            <input type="number" v-model.number="currentQuestion.time_limit" class="mt-1 form-input w-24">
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                    <button type="button" @click="isQuestionModalOpen = false" class="btn btn-secondary">取消</button>
                    <button type="submit" class="btn btn-primary">儲存題目</button>
                </div>
            </form>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { authFetch } from '@/utils/api';

const loading = ref(true);
const quizSets = ref([]);
const subjects = ref([]);

const isSetModalOpen = ref(false);
const currentSet = ref({});

const isQuestionsModalOpen = ref(false);
const selectedSet = ref(null);
const questions = ref([]);

const isQuestionModalOpen = ref(false);
const currentQuestion = ref({});
const questionEditor = ref(null);
const quizFileInput = ref(null);


// --- 測驗集管理 ---
const openSetModal = (set) => {
  currentSet.value = set ? { ...set } : { title: '', subject_id: null };
  isSetModalOpen.value = true;
};

const saveSet = async () => {
  const isEditing = !!currentSet.value.id;
  const url = isEditing ? `/api/quiz-sets/${currentSet.value.id}` : '/api/quiz-sets';
  const method = isEditing ? 'PUT' : 'POST';
  
  try {
    const res = await authFetch(url, { method, body: JSON.stringify(currentSet.value) });
    const savedSet = await res.json();
    if (isEditing) {
      const index = quizSets.value.findIndex(s => s.id === savedSet.id);
      quizSets.value[index] = savedSet;
    } else {
      quizSets.value.unshift(savedSet);
    }
    isSetModalOpen.value = false;
  } catch (error) { console.error("儲存測驗集失敗:", error); }
};

const deleteSet = async (setId) => {
  if (!confirm('確定要刪除這個測驗集嗎？所有相關的題目將會一併刪除！')) return;
  try {
    await authFetch(`/api/quiz-sets/${setId}`, { method: 'DELETE' });
    quizSets.value = quizSets.value.filter(s => s.id !== setId);
  } catch (error) { console.error("刪除測驗集失敗:", error); }
};


// --- 題目管理 ---
const fetchQuestionsForSet = async (set) => {
    try {
        const res = await authFetch(`/api/quiz-questions/${set.id}`);
        if (!res.ok) throw new Error('讀取題目失敗');
        questions.value = await res.json();
    } catch (error) { 
        console.error("讀取題目失敗:", error);
        alert(error.message);
    }
};

const openQuestionsModal = async (set) => {
  selectedSet.value = set;
  isQuestionsModalOpen.value = true;
  await fetchQuestionsForSet(set);
};

const closeQuestionsModal = () => {
    isQuestionsModalOpen.value = false;
    selectedSet.value = null;
    questions.value = [];
};

const openQuestionModal = (question) => {
  currentQuestion.value = question ? JSON.parse(JSON.stringify(question)) : { // Deep copy
    quiz_set_id: selectedSet.value.id,
    question_text: '',
    options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }],
    time_limit: 20
  };
  isQuestionModalOpen.value = true;
};

const addOption = () => {
    if (currentQuestion.value.options.length < 4) {
        currentQuestion.value.options.push({ text: '', isCorrect: false });
    }
};

const removeOption = (index) => {
    if (currentQuestion.value.options.length > 2) {
        // If removing the correct answer, make the first one correct
        if (currentQuestion.value.options[index].isCorrect) {
            currentQuestion.value.options[0].isCorrect = true;
        }
        currentQuestion.value.options.splice(index, 1);
    }
};

const setCorrectOption = (selectedIndex) => {
    currentQuestion.value.options.forEach((opt, index) => {
        opt.isCorrect = (index === selectedIndex);
    });
};

const saveQuestion = async () => {
    currentQuestion.value.question_text = questionEditor.value.innerHTML;
    const isEditing = !!currentQuestion.value.id;
    const url = isEditing ? `/api/quiz-questions/${currentQuestion.value.id}` : '/api/quiz-questions';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const res = await authFetch(url, { method, body: JSON.stringify(currentQuestion.value) });
        const savedQuestion = await res.json();
        if (isEditing) {
            const index = questions.value.findIndex(q => q.id === savedQuestion.id);
            questions.value[index] = savedQuestion;
        } else {
            questions.value.push(savedQuestion);
        }
        isQuestionModalOpen.value = false;
    } catch (error) { console.error("儲存題目失敗:", error); }
};

const deleteQuestion = async (questionId) => {
    if (!confirm('確定要刪除這個題目嗎？')) return;
    try {
        await authFetch(`/api/quiz-questions/${questionId}`, { method: 'DELETE' });
        questions.value = questions.value.filter(q => q.id !== questionId);
    } catch (error) { console.error("刪除題目失敗:", error); }
};

const triggerQuizImport = () => {
    quizFileInput.value.click();
};

const handleQuizImport = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedSet.value) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await authFetch(`/api/quiz-questions/import/${selectedSet.value.id}`, {
            method: 'POST',
            body: formData,
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        
        alert(result.message);
        await fetchQuestionsForSet(selectedSet.value); // Refresh list
    } catch (error) {
        console.error("匯入題庫失敗:", error);
        alert(`匯入失敗: ${error.message}`);
    } finally {
        quizFileInput.value.value = ''; // Reset file input
    }
};

onMounted(async () => {
  try {
    const [setsRes, subjectsRes] = await Promise.all([
      authFetch('/api/quiz-sets'),
      authFetch('/api/subjects')
    ]);
    quizSets.value = await setsRes.json();
    subjects.value = await subjectsRes.json();
  } catch (error) {
    console.error("初始化失敗:", error);
  } finally {
    loading.value = false;
  }
});
</script>

