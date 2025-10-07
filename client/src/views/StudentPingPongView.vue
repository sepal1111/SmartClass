<!-- File Path: /client/src/views/StudentPingPongView.vue -->
<template>
    <div class="min-h-screen bg-sky-50 flex items-center justify-center p-4 font-sans">
        <div class="w-full transition-all duration-300" :class="currentQuestion?.type === 'image' ? 'max-w-4xl' : 'max-w-md'">

            <!-- 狀態一：加入房間 -->
            <div v-if="!session.joined" class="bg-white rounded-2xl shadow-2xl p-8 transform transition-all hover:scale-105 duration-300">
                <h1 class="text-3xl font-bold text-center text-sky-600 mb-2">加入 PingPong 活動</h1>
                <p class="text-center text-gray-500 mb-8">請輸入老師提供的房間代碼</p>
                <form @submit.prevent="joinRoom" class="space-y-6">
                    <div>
                        <label for="roomCode" class="block text-sm font-bold text-gray-600 mb-1">房間代碼</label>
                        <input v-model.trim="form.roomCode" type="text" id="roomCode" placeholder="ABCDEF"
                               class="form-input text-3xl tracking-widest text-center uppercase">
                    </div>
                    <div>
                        <label for="studentName" class="block text-sm font-bold text-gray-600 mb-1">你的名字</label>
                        <input v-model.trim="form.name" type="text" id="studentName" placeholder="請輸入姓名"
                               class="form-input text-lg">
                    </div>
                    <p v-if="error" class="text-red-500 text-sm text-center">{{ error }}</p>
                    <button type="submit" class="w-full btn btn-primary py-4 text-xl font-bold">
                        加入
                    </button>
                </form>
            </div>

            <!-- 狀態二：等待問題 -->
            <div v-if="session.joined && !currentQuestion" class="text-center">
                 <h2 class="text-3xl font-bold text-gray-700">已成功加入！</h2>
                 <p class="text-gray-500 mt-2 text-lg">請等待老師開始提問...</p>
                 <div class="mt-8">
                    <svg class="animate-spin h-12 w-12 text-sky-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                 </div>
            </div>
            
            <!-- 狀態三：回答問題 -->
            <div v-if="session.joined && currentQuestion && !submittedAnswer" class="bg-white rounded-2xl shadow-2xl" :class="currentQuestion.type === 'image' ? 'p-4' : 'p-8'">
                <div class="mb-6 max-h-60 overflow-y-auto p-2" v-if="currentQuestion.htmlContent" v-html="currentQuestion.htmlContent"></div>
                <div class="mb-6" v-else-if="currentQuestion.text">
                     <p class="text-2xl font-semibold text-center text-gray-800">{{ currentQuestion.text }}</p>
                </div>

                <!-- 單選題 -->
                <div v-if="currentQuestion.type === 'multiple-choice'" class="grid grid-cols-2 gap-4">
                    <button v-for="opt in ['A','B','C','D']" :key="opt"
                            @click="submitAnswer(opt)"
                            class="answer-btn text-5xl font-bold h-32">
                        {{ opt }}
                    </button>
                </div>
                
                <!-- 是非題 -->
                 <div v-if="currentQuestion.type === 'true-false'" class="grid grid-cols-2 gap-4">
                    <button @click="submitAnswer('O')" class="answer-btn h-32">
                        <svg class="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </button>
                     <button @click="submitAnswer('X')" class="answer-btn h-32">
                        <svg class="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </button>
                </div>

                <!-- 簡答題 -->
                <form v-if="currentQuestion.type === 'short-answer'" @submit.prevent="submitAnswer(shortAnswerText)">
                    <textarea v-model="shortAnswerText" rows="5" class="form-input text-lg" placeholder="請在此輸入您的答案..."></textarea>
                     <button type="submit" class="w-full mt-4 btn btn-primary py-3 text-lg font-bold">送出答案</button>
                </form>
                
                <!-- 繪圖題 -->
                <div v-if="currentQuestion.type === 'image'">
                     <div class="bg-gray-100 p-2 rounded-t-lg flex items-center justify-center gap-2 md:gap-4 flex-wrap">
                        <label class="text-sm font-medium">顏色: <input type="color" v-model="brushColor" class="w-8 h-8"></label>
                        <div class="flex items-center gap-2">
                            <label class="text-sm font-medium">筆刷:</label>
                            <input type="range" v-model="brushSize" min="1" max="50" class="w-32">
                            <span class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                <span class="rounded-full bg-black" :style="{ width: brushSize + 'px', height: brushSize + 'px' }"></span>
                            </span>
                        </div>
                        <button @click="clearCanvas" class="bg-white py-2 px-4 rounded-md text-sm font-semibold shadow-sm hover:bg-gray-200">清除</button>
                    </div>
                    <canvas ref="drawingCanvas" class="border-x border-b border-gray-300 bg-white w-full aspect-[4/3]" style="touch-action: none;"></canvas>
                    <button @click="submitDrawing" class="mt-4 w-full btn bg-orange-500 hover:bg-orange-600 text-lg font-bold py-3">送出繪圖</button>
                </div>
            </div>

             <!-- 狀態四：已送出答案 -->
            <div v-if="session.joined && submittedAnswer" class="text-center">
                 <h2 class="text-3xl font-bold text-green-600">已成功送出答案！</h2>
                 <p class="text-gray-500 mt-2 text-lg">請等待下一題或老師公佈結果...</p>
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
    socket.value.emit('student:submitAnswer', { roomCode: form.roomCode.toUpperCase(), answer });
    submittedAnswer.value = true;
};

onMounted(() => {
    const roomFromUrl = route.query.room;
    if (roomFromUrl) form.roomCode = roomFromUrl.toUpperCase();

    const studentInfo = localStorage.getItem('studentInfo');
    if (studentInfo) form.name = JSON.parse(studentInfo).name;
    
    socket.value = io("http://localhost:3000");

    socket.value.on('connect', () => console.log("成功連接到 Socket.IO 伺服器"));
    socket.value.on('question:started', (question) => { currentQuestion.value = question; submittedAnswer.value = false; shortAnswerText.value = ''; });
    socket.value.on('question:ended', () => { currentQuestion.value = null; submittedAnswer.value = true; });
    socket.value.on('activity:ended', (message) => {
        alert(message || '老師已結束活動，將返回加入頁面。');
        session.joined = false;
        currentQuestion.value = null;
        submittedAnswer.value = false;
        error.value = '';
    });
});

onUnmounted(() => { if (socket.value) socket.value.disconnect(); });
</script>

<style>
#question-area img {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
    display: block;
    margin: 0.5rem auto;
}
.answer-btn {
    @apply bg-white border-2 border-gray-200 rounded-xl shadow-sm 
           flex items-center justify-center 
           transition-all duration-200 transform 
           hover:scale-105 hover:border-sky-400 hover:shadow-lg;
}
</style>

