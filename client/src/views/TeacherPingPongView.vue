<!-- File Path: /client/src/views/TeacherPingPongView.vue -->
<template>
    <div class="pingpong-teacher-container">
        <h1 class="text-3xl font-bold mb-6">PingPong 即時問答</h1>

        <!-- 狀態一：尚未建立活動 -->
        <div v-if="!roomCode" class="text-center p-10 bg-white rounded-lg shadow-lg">
            <h2 class="text-2xl font-semibold text-gray-700 mb-4">開始一個新的問答活動</h2>
            <p class="text-gray-500 mb-6">點擊下方按鈕以產生一個活動房間代碼，讓學生可以加入。</p>
            <button @click="createSession" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105">
                建立新活動
            </button>
        </div>

        <!-- 狀態二：已建立活動，等待或進行中 -->
        <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- 左側：活動資訊與學生列表 -->
            <div class="lg:col-span-1 bg-white p-6 rounded-lg shadow-lg">
                <h2 class="text-xl font-semibold text-gray-800">活動進行中</h2>
                <div class="mt-4 p-4 bg-indigo-100 rounded-lg text-center">
                    <p class="text-sm text-indigo-700">房間代碼:</p>
                    <p class="text-4xl font-bold text-indigo-900 tracking-widest">{{ roomCode }}</p>
                </div>
                 <div class="mt-4 flex justify-center">
                    <img :src="qrCodeUrl" alt="QR Code" class="w-40 h-40 border-4 border-gray-200 rounded-lg">
                </div>
                <p class="text-center text-gray-500 mt-2 text-sm">請學生掃描 QR Code 或輸入代碼加入</p>

                <hr class="my-6">

                <h3 class="text-lg font-semibold text-gray-800 mb-2">已連線學生 ({{ connectedStudents.length }})</h3>
                <ul class="h-40 overflow-y-auto bg-gray-50 p-2 rounded-md border">
                    <li v-for="student in connectedStudents" :key="student.id" class="text-gray-700 py-1">
                        {{ student.name }}
                    </li>
                </ul>

                 <button @click="endActivity" class="w-full mt-6 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    結束活動
                </button>
            </div>

            <!-- 右側：問題設定與結果顯示 -->
            <div class="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg">
                <!-- 問題設定區 -->
                <div v-if="activityState === 'waiting' || activityState === 'results'">
                     <h2 class="text-xl font-semibold text-gray-800 mb-4">設定新問題</h2>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">問題類型</label>
                            <select v-model="question.type" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                <option value="multiple-choice">單選題</option>
                                <option value="true-false">是非題</option>
                                <option value="short-answer">簡答題</option>
                                <option value="image">繪圖題</option>
                            </select>
                        </div>
                         <div>
                            <label class="block text-sm font-medium text-gray-700">問題內容</label>
                            <textarea v-model="question.text" rows="3" class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"></textarea>
                        </div>
                        <div v-if="question.type === 'multiple-choice'" class="space-y-2">
                             <label class="block text-sm font-medium text-gray-700">選項</label>
                            <input type="text" v-model="question.options[0]" placeholder="選項 A" class="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
                            <input type="text" v-model="question.options[1]" placeholder="選項 B" class="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
                            <input type="text" v-model="question.options[2]" placeholder="選項 C" class="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
                            <input type="text" v-model="question.options[3]" placeholder="選項 D" class="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
                        </div>
                        <button @click="startQuestion" :disabled="!isQuestionValid" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">
                            開始提問
                        </button>
                    </div>
                </div>

                <!-- 問題進行中... -->
                 <div v-if="activityState === 'question'">
                    <h2 class="text-xl font-semibold text-gray-800 mb-2">問題進行中...</h2>
                    <div class="p-4 border-2 border-indigo-500 rounded-lg bg-indigo-50">
                        <p class="font-bold text-lg text-gray-800">{{ question.text }}</p>
                    </div>
                     <p class="text-center my-4 text-gray-600">已作答人數: {{ Object.keys(answers).length }} / {{ connectedStudents.length }}</p>
                    
                    <!-- 即時結果顯示 -->
                    <div>
                        <!-- 選擇/是非題 圖表 -->
                        <div v-if="question.type === 'multiple-choice' || question.type === 'true-false'" class="space-y-2">
                             <div v-for="(count, option) in answerStats" :key="option" class="w-full bg-gray-200 rounded-full h-8">
                                <div class="bg-blue-600 text-xs font-medium text-blue-100 text-center p-1 leading-none rounded-full h-8 flex items-center justify-between px-3" 
                                     :style="{ width: (count / (connectedStudents.length || 1) * 100) + '%' }">
                                    <span>{{ option }}</span>
                                    <span>{{ count }}</span>
                                </div>
                            </div>
                        </div>
                        <!-- 繪圖/文字題 縮圖 -->
                        <div v-if="question.type === 'image' || question.type === 'short-answer'" class="grid grid-cols-2 md:grid-cols-3 gap-2">
                           <div v-for="ans in answers" :key="ans.id" @click="openResponseModal(ans)" class="p-1 border rounded-lg cursor-pointer hover:bg-gray-100">
                               <p class="text-sm font-semibold text-center truncate">{{ ans.name }}</p>
                               <img v-if="question.type === 'image'" :src="ans.answer" class="w-full h-auto rounded aspect-video object-contain bg-gray-200"/>
                               <p v-else class="text-xs p-2 bg-gray-100 rounded truncate">{{ ans.answer }}</p>
                           </div>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
        
        <!-- 單一回應檢視 Modal -->
        <div v-if="isResponseModalOpen" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                 <div class="p-4 border-b flex justify-between items-center">
                    <h3 class="text-xl font-bold">{{ selectedResponse.name }} 的回應</h3>
                    <button @click="isResponseModalOpen = false" class="text-2xl text-gray-500 hover:text-gray-800">&times;</button>
                </div>
                <div class="p-6 overflow-y-auto flex-grow flex items-center justify-center">
                    <img v-if="question.type === 'image'" :src="selectedResponse.answer" class="max-w-full max-h-full object-contain">
                    <p v-else class="text-2xl whitespace-pre-wrap">{{ selectedResponse.answer }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue';
import { io } from 'socket.io-client';

const socket = ref(null);
const roomCode = ref('');
const qrCodeUrl = computed(() => `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${window.location.origin}/pingpong-student?room=${roomCode.value}`);
const connectedStudents = ref([]);
const activityState = ref('waiting');
const question = reactive({
    type: 'multiple-choice',
    text: '',
    options: ['', '', '', ''],
});
const answers = ref({});

// Modal 狀態
const isResponseModalOpen = ref(false);
const selectedResponse = ref({ name: '', answer: ''});

const isQuestionValid = computed(() => {
    if (!question.text.trim()) return false;
    if (question.type === 'multiple-choice') {
        return question.options.filter(opt => opt.trim()).length >= 2;
    }
    return true;
});

const answerStats = computed(() => {
    const stats = {};
    if (activityState.value === 'question' && (question.type === 'multiple-choice' || question.type === 'true-false')) {
        if(question.type === 'multiple-choice') {
             question.options.forEach((opt, index) => {
                if (opt.trim()) stats[String.fromCharCode(65 + index)] = 0;
            });
        } else if (question.type === 'true-false') {
            stats['是'] = 0;
            stats['否'] = 0;
        }
        for (const studentId in answers.value) {
            const studentAnswer = answers.value[studentId].answer;
            if (stats[studentAnswer] !== undefined) stats[studentAnswer]++;
        }
    }
    return stats;
});

const createSession = () => {
    socket.value.emit('teacher:createRoom', (response) => {
        if (response.roomCode) roomCode.value = response.roomCode;
    });
};

const startQuestion = () => {
    let questionToSend = { type: question.type, text: question.text };
    if (question.type === 'multiple-choice') {
        questionToSend.options = question.options.filter(opt => opt.trim());
    }
    socket.value.emit('teacher:startQuestion', { roomCode: roomCode.value, question: questionToSend });
};

const endActivity = () => {
    if (confirm('確定要結束這次的 PingPong 活動嗎？所有連線都將中斷。')) {
        socket.value.emit('teacher:endActivity', { roomCode: roomCode.value });
        roomCode.value = '';
    }
};

const openResponseModal = (response) => {
    selectedResponse.value = response;
    isResponseModalOpen.value = true;
};

onMounted(() => {
    socket.value = io("http://localhost:3000");
    socket.value.on('connect', () => console.log("成功連接到 Socket.IO 伺服器"));
    socket.value.on('student:joined', (students) => connectedStudents.value = students);
    socket.value.on('student:left', (students) => connectedStudents.value = students);
    socket.value.on('teacher:questionStarted', () => { activityState.value = 'question'; answers.value = {}; });
    socket.value.on('student:answered', (currentAnswers) => answers.value = currentAnswers);
    socket.value.on('activity:ended', (message) => { alert(message || '活動已結束'); roomCode.value = ''; activityState.value = 'waiting'; });
});

onUnmounted(() => {
    if (socket.value) {
        if (roomCode.value) socket.value.emit('teacher:endActivity', { roomCode: roomCode.value });
        socket.value.disconnect();
    }
});
</script>

