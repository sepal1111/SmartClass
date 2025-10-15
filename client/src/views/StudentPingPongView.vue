<!-- File Path: /client/src/views/StudentPingPongView.vue -->
<template>
    <div class="min-h-screen bg-sky-100 flex items-center justify-center p-4 font-sans">
        <div class="w-full transition-all duration-300" :class="currentQuestion?.type === 'image' || showResult?.questionType === 'image' ? 'max-w-4xl' : 'max-w-lg'">

            <!-- 狀態六：活動結束 -->
            <div v-if="activityEndedMessage" class="card p-8 text-center">
                <h2 class="text-3xl font-bold text-slate-700">{{ activityEndedMessage }}</h2>
                <p class="text-slate-500 mt-2 text-xl">此頁面將在幾秒後重設。</p>
                <div class="mt-8">
                    <svg class="h-16 w-16 text-slate-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
            </div>

            <!-- 狀態一：加入房間 -->
            <div v-else-if="!session.joined" class="card p-8 transform transition-all hover:shadow-2xl duration-300">
                <h1 class="text-3xl font-bold text-center text-sky-600 mb-2">加入 即時問答 活動</h1>
                <p class="text-center text-slate-500 mb-8">請輸入老師提供的房間代碼</p>
                <form @submit.prevent="joinRoom" class="space-y-6">
                    <div>
                        <label for="roomCode" class="block text-lg font-bold text-slate-600 mb-1">房間代碼</label>
                        <input v-model.trim="form.roomCode" type="text" id="roomCode" placeholder="ABCDEF"
                               class="form-input text-4xl tracking-widest text-center uppercase py-3">
                    </div>
                    <div>
                        <label for="studentName" class="block text-lg font-bold text-slate-600 mb-1">你的名字</label>
                        <input v-model.trim="form.name" type="text" id="studentName" placeholder="請輸入姓名或座號"
                               class="form-input text-2xl py-3">
                    </div>
                    <p v-if="error" class="text-red-500 text-sm text-center pt-2">{{ error }}</p>
                    <button type="submit" class="w-full btn btn-primary py-4 text-2xl font-bold">
                        加入
                    </button>
                </form>
            </div>

            <!-- 狀態五：顯示結果 -->
            <div v-else-if="showResult" class="card p-8 text-center">
                <!-- 有正確答案的題型 -->
                <div v-if="showResult.isCorrect !== null">
                    <div v-if="showResult.isCorrect">
                        <svg class="mx-auto h-24 w-24 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                        <h2 class="mt-6 text-5xl font-bold text-green-600">答對了！</h2>
                    </div>
                    <div v-else>
                        <svg class="mx-auto h-24 w-24 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>
                        <h2 class="mt-6 text-5xl font-bold text-red-600">答錯了</h2>
                        <p v-if="showResult.correctAnswer" class="text-slate-500 mt-4 text-2xl">正確答案是： <span class="font-bold text-slate-700">{{ showResult.correctAnswer }}</span></p>
                    </div>
                </div>
                <!-- 沒有正確答案的題型 -->
                <div v-else>
                    <h2 class="text-3xl font-bold text-slate-700 mb-6">您回答的內容：</h2>
                    <div v-if="showResult.questionType === 'image'">
                        <img :src="showResult.myAnswer" class="max-w-full max-h-80 mx-auto border rounded-lg bg-white p-2"/>
                    </div>
                    <div v-else class="text-2xl text-slate-600 bg-slate-100 p-4 rounded-lg break-words whitespace-pre-wrap">
                        {{ showResult.myAnswer }}
                    </div>
                </div>
                <p class="text-slate-400 mt-8 text-lg animate-pulse">準備下一題...</p>
            </div>

            <!-- 狀態三：回答問題 -->
            <div v-else-if="session.joined && currentQuestion && !submittedAnswer" class="card" :class="currentQuestion.type === 'image' ? 'p-4' : 'p-8'">
                <div id="question-area" class="mb-6 max-h-60 overflow-y-auto p-2 text-xl" v-if="currentQuestion.htmlContent" v-html="currentQuestion.htmlContent"></div>
                <div class="mb-6" v-else-if="currentQuestion.text">
                     <p class="text-3xl font-semibold text-center text-slate-800">{{ currentQuestion.text }}</p>
                </div>

                <!-- 單選題 -->
                <div v-if="currentQuestion.type === 'multiple-choice'" class="grid grid-cols-2 gap-4">
                    <button v-for="opt in ['A','B','C','D']" :key="opt" @click="submitAnswer(opt)" class="answer-btn-student text-7xl font-bold h-40">
                        {{ opt }}
                    </button>
                </div>
                
                <!-- 是非題 -->
                 <div v-if="currentQuestion.type === 'true-false'" class="grid grid-cols-2 gap-4">
                    <button @click="submitAnswer('O')" class="answer-btn-student h-40">
                        <svg class="w-24 h-24 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </button>
                     <button @click="submitAnswer('X')" class="answer-btn-student h-40">
                        <svg class="w-24 h-24 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </button>
                </div>

                <!-- 簡答題 -->
                <form v-if="currentQuestion.type === 'short-answer'" @submit.prevent="submitAnswer(shortAnswerText)">
                    <textarea v-model="shortAnswerText" rows="6" class="form-input text-xl" placeholder="請在此輸入您的答案..."></textarea>
                     <button type="submit" class="w-full mt-4 btn btn-primary py-4 text-xl font-bold">送出答案</button>
                </form>
                
                <!-- 繪圖題 -->
                <div v-if="currentQuestion.type === 'image'">
                     <div class="bg-slate-100 p-2 rounded-t-lg flex items-center justify-center gap-2 md:gap-4 flex-wrap">
                        <label class="text-base font-medium">顏色: <input type="color" v-model="brushColor" class="w-10 h-10"></label>
                        <div class="flex items-center gap-2">
                            <label class="text-base font-medium">筆刷:</label>
                            <input type="range" v-model="brushSize" min="1" max="50" class="w-32 md:w-48">
                            <span class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                <span class="rounded-full bg-black" :style="{ width: brushSize + 'px', height: brushSize + 'px' }"></span>
                            </span>
                        </div>
                        <button @click="clearCanvas" class="btn btn-secondary text-base">清除</button>
                    </div>
                    <canvas ref="drawingCanvas" class="border-x border-b border-gray-300 bg-white w-full aspect-video" style="touch-action: none;"></canvas>
                    <button @click="submitDrawing" class="mt-4 w-full btn bg-orange-500 hover:bg-orange-600 text-xl font-bold py-4">送出我的作品</button>
                </div>
            </div>

             <!-- 狀態四：已送出答案 -->
            <div v-else-if="session.joined && submittedAnswer" class="text-center p-8 card">
                <svg class="mx-auto h-24 w-24 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                 <h2 class="mt-6 text-3xl font-bold text-green-600">已成功送出答案！</h2>
                 <p class="text-slate-500 mt-2 text-lg">請等待下一題或老師公佈結果...</p>
            </div>

            <!-- 狀態二：等待問題 -->
            <div v-else-if="session.joined && !currentQuestion" class="text-center p-8 card">
                 <h2 class="text-4xl font-bold text-slate-700">已成功加入！</h2>
                 <p class="text-slate-500 mt-2 text-xl">請等待老師開始提問...</p>
                 <div class="mt-12">
                    <svg class="animate-spin h-16 w-16 text-sky-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                 </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { io } from 'socket.io-client';

const socket = ref(null);
const route = useRoute();
const form = reactive({ roomCode: '', name: '' });
const session = reactive({ joined: false });
const error = ref('');
const currentQuestion = ref(null);
const submittedAnswer = ref(false);
const shortAnswerText = ref('');
const activityEndedMessage = ref('');
const myLastAnswer = ref(null);
const showResult = ref(null);

const drawingCanvas = ref(null);
const ctx = ref(null);
const isDrawing = ref(false);
const brushColor = ref('#000000');
const brushSize = ref(5);

const setupCanvas = () => {
    if (!drawingCanvas.value) return;
    ctx.value = drawingCanvas.value.getContext('2d');
    const canvas = drawingCanvas.value;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
};

const getPos = (e) => {
    const canvas = drawingCanvas.value;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
}

const startDrawing = (e) => { e.preventDefault(); isDrawing.value = true; const {x, y} = getPos(e); ctx.value.beginPath(); ctx.value.moveTo(x, y); };
const draw = (e) => {
    if (!isDrawing.value) return;
    e.preventDefault();
    const {x, y} = getPos(e);
    ctx.value.lineTo(x, y);
    ctx.value.strokeStyle = brushColor.value;
    ctx.value.lineWidth = brushSize.value;
    ctx.value.lineCap = 'round';
    ctx.value.lineJoin = 'round';
    ctx.value.stroke();
};
const stopDrawing = () => { if (!isDrawing.value) return; isDrawing.value = false; ctx.value.closePath(); };
const clearCanvas = () => { ctx.value.clearRect(0, 0, drawingCanvas.value.width, drawingCanvas.value.height); };
const submitDrawing = () => {
    const canvas = drawingCanvas.value;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);
    submitAnswer(tempCanvas.toDataURL('image/png'));
};

watch(currentQuestion, (newQuestion) => { if (newQuestion?.type === 'image') nextTick(setupCanvas); });

const joinRoom = () => {
    if (!form.roomCode || !form.name) { error.value = '房間代碼和姓名為必填項。'; return; }
    error.value = '';
    socket.value.emit('student:joinRoom', { roomCode: form.roomCode.toUpperCase(), name: form.name }, (response) => {
        if (response.success) session.joined = true;
        else error.value = response.message;
    });
};

const submitAnswer = (answer) => {
    if(typeof answer === 'string' && !answer.trim()) return;
    myLastAnswer.value = answer;
    socket.value.emit('student:submitAnswer', { roomCode: form.roomCode.toUpperCase(), answer });
    submittedAnswer.value = true;
};

onMounted(() => {
    const roomFromUrl = route.query.room;
    if (roomFromUrl) form.roomCode = roomFromUrl.toUpperCase();

    const studentInfo = localStorage.getItem('studentInfo');
    if (studentInfo) form.name = JSON.parse(studentInfo).name;
    
    // *** 關鍵修正：移除寫死的 "http://localhost:3000" ***
    // 這樣它會自動連接到提供網頁的伺服器 (也就是您電腦的 IP)
    socket.value = io();

    socket.value.on('connect', () => console.log("成功連接到 Socket.IO 伺服器"));
    socket.value.on('question:started', (question) => { currentQuestion.value = question; submittedAnswer.value = false; shortAnswerText.value = ''; });
    
    socket.value.on('question:ended', (results) => { 
        const questionType = currentQuestion.value?.type;
        const correctAnswer = currentQuestion.value?.correctAnswer;
        let isCorrect = null;

        if (questionType === 'multiple-choice' || questionType === 'true-false') {
            isCorrect = myLastAnswer.value === correctAnswer;
        }

        showResult.value = {
            myAnswer: myLastAnswer.value,
            correctAnswer: correctAnswer,
            questionType: questionType,
            isCorrect: isCorrect
        };

        currentQuestion.value = null; 
        submittedAnswer.value = false; 

        setTimeout(() => {
            showResult.value = null;
            myLastAnswer.value = null;
        }, 5000);
    });

    socket.value.on('activity:ended', (message) => {
        activityEndedMessage.value = message || '老師已結束活動。';
        session.joined = false;
        currentQuestion.value = null;
        submittedAnswer.value = false;
        setTimeout(() => {
            activityEndedMessage.value = '';
            error.value = '';
        }, 5000);
    });
});


onUnmounted(() => { if (socket.value) socket.value.disconnect(); });
</script>

<style>
#question-area img {
    max-width: 100%;
    max-height: 240px; /* Increased height for better viewing on iPad */
    object-fit: contain;
    display: block;
    margin: 0.5rem auto;
}
.answer-btn-student {
    @apply bg-white border-4 border-slate-200 rounded-2xl shadow-lg 
           flex items-center justify-center 
           transition-all duration-200 transform 
           hover:scale-105 hover:border-sky-400 hover:shadow-xl;
}
</style>

