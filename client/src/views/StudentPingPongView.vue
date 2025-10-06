<!-- File Path: /client/src/views/StudentPingPongView.vue -->
<template>
    <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div class="w-full max-w-md">

            <!-- 狀態一：加入房間 -->
            <div v-if="!session.joined" class="bg-white rounded-xl shadow-2xl p-8">
                <h1 class="text-3xl font-bold text-center text-gray-800 mb-2">加入 PingPong 活動</h1>
                <p class="text-center text-gray-500 mb-6">請輸入老師提供的房間代碼</p>
                <form @submit.prevent="joinRoom" class="space-y-4">
                    <div>
                        <label for="roomCode" class="block text-sm font-medium text-gray-700">房間代碼</label>
                        <input v-model.trim="form.roomCode" type="text" id="roomCode" placeholder="ABCDEF"
                               class="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-2xl tracking-widest text-center uppercase focus:ring-2 focus:ring-indigo-500">
                    </div>
                    <div>
                        <label for="studentName" class="block text-sm font-medium text-gray-700">你的名字</label>
                        <input v-model.trim="form.name" type="text" id="studentName" placeholder="請輸入姓名"
                               class="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500">
                    </div>
                    <p v-if="error" class="text-red-500 text-sm text-center">{{ error }}</p>
                    <button type="submit"
                            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                        加入
                    </button>
                </form>
            </div>

            <!-- 狀態二：等待問題 -->
            <div v-if="session.joined && !currentQuestion" class="text-center">
                 <h2 class="text-2xl font-semibold text-gray-700">已成功加入！</h2>
                 <p class="text-gray-500 mt-2">請等待老師開始提問...</p>
                 <div class="mt-8">
                    <svg class="animate-spin h-10 w-10 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                 </div>
            </div>
            
            <!-- 狀態三：回答問題 -->
            <div v-if="session.joined && currentQuestion && !submittedAnswer" class="bg-white rounded-xl shadow-2xl p-8">
                <div class="mb-6">
                    <p class="text-sm text-gray-500">問題</p>
                    <p class="text-xl font-semibold text-gray-800">{{ currentQuestion.text }}</p>
                </div>

                <!-- 單選題 -->
                <div v-if="currentQuestion.type === 'multiple-choice'" class="space-y-3">
                    <button v-for="(option, index) in currentQuestion.options" :key="index"
                            @click="submitAnswer(String.fromCharCode(65 + index))"
                            class="w-full text-left p-4 border rounded-lg text-lg font-medium flex items-center space-x-4 hover:bg-indigo-100 hover:border-indigo-500 transition-colors">
                        <span class="font-bold text-indigo-700">{{ String.fromCharCode(65 + index) }}</span>
                        <span>{{ option }}</span>
                    </button>
                </div>
                
                <!-- 是非題 -->
                 <div v-if="currentQuestion.type === 'true-false'" class="space-y-3">
                    <button @click="submitAnswer('是')"
                            class="w-full p-4 border rounded-lg text-lg font-medium hover:bg-green-100 hover:border-green-500 transition-colors">
                        是 (O)
                    </button>
                     <button @click="submitAnswer('否')"
                            class="w-full p-4 border rounded-lg text-lg font-medium hover:bg-red-100 hover:border-red-500 transition-colors">
                        否 (X)
                    </button>
                </div>

                <!-- 簡答題 -->
                <form v-if="currentQuestion.type === 'short-answer'" @submit.prevent="submitAnswer(shortAnswerText)">
                    <textarea v-model="shortAnswerText" rows="4" class="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"></textarea>
                     <button type="submit"
                            class="w-full mt-4 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                        送出答案
                    </button>
                </form>
                
                <!-- 繪圖題 -->
                <div v-if="currentQuestion.type === 'image'">
                     <div class="bg-gray-200 p-2 rounded-t-lg flex items-center justify-center gap-2 flex-wrap">
                        <label class="text-sm">顏色: <input type="color" v-model="brushColor"></label>
                        <label class="text-sm">筆刷: <input type="range" v-model="brushSize" min="1" max="20"></label>
                        <button @click="clearCanvas" class="bg-white py-1 px-2 rounded text-sm">清除</button>
                    </div>
                    <canvas ref="drawingCanvas" class="border bg-white w-full aspect-video" style="touch-action: none;"></canvas>
                    <button @click="submitDrawing" class="mt-2 w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg">送出繪圖</button>
                </div>

            </div>

             <!-- 狀態四：已送出答案 -->
            <div v-if="session.joined && submittedAnswer" class="text-center">
                 <h2 class="text-2xl font-semibold text-green-600">已成功送出答案！</h2>
                 <p class="text-gray-500 mt-2">請等待下一題...</p>
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

// --- 繪圖相關狀態 ---
const drawingCanvas = ref(null);
const ctx = ref(null);
const isDrawing = ref(false);
const brushColor = ref('#000000');
const brushSize = ref(3);

const setupCanvas = () => {
    if (!drawingCanvas.value) return;
    ctx.value = drawingCanvas.value.getContext('2d');
    const canvas = drawingCanvas.value;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // --- 綁定事件 ---
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
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
    const dataUrl = drawingCanvas.value.toDataURL('image/png');
    submitAnswer(dataUrl);
};
// --- 繪圖邏輯結束 ---

watch(currentQuestion, (newQuestion) => {
    if (newQuestion && newQuestion.type === 'image') {
        nextTick(() => {
            setupCanvas();
        });
    }
});


const joinRoom = () => {
    if (!form.roomCode || !form.name) {
        error.value = '房間代碼和姓名為必填項。';
        return;
    }
    error.value = '';
    socket.value.emit('student:joinRoom', { roomCode: form.roomCode.toUpperCase(), name: form.name }, (response) => {
        if (response.success) {
            session.joined = true;
        } else {
            error.value = response.message;
        }
    });
};

const submitAnswer = (answer) => {
    if(typeof answer === 'string' && !answer.trim()) return;
    socket.value.emit('student:submitAnswer', { roomCode: form.roomCode.toUpperCase(), answer });
    submittedAnswer.value = true;
};

onMounted(() => {
    // 檢查 URL 中是否有 room 參數
    const roomFromUrl = route.query.room;
    if (roomFromUrl) form.roomCode = roomFromUrl.toUpperCase();

    // 檢查是否為已登入學生，若是則自動填入姓名
    const studentInfo = localStorage.getItem('studentInfo');
    if (studentInfo) {
        form.name = JSON.parse(studentInfo).name;
    }
    
    socket.value = io("http://localhost:3000");

    socket.value.on('connect', () => console.log("成功連接到 Socket.IO 伺服器"));
    
    socket.value.on('question:started', (question) => {
        currentQuestion.value = question;
        submittedAnswer.value = false;
        shortAnswerText.value = '';
    });
    
    socket.value.on('activity:ended', (message) => {
        alert(message || '老師已結束活動，將返回加入頁面。');
        session.joined = false;
        currentQuestion.value = null;
        submittedAnswer.value = false;
        error.value = '';
    });
});

onUnmounted(() => {
    if (socket.value) socket.value.disconnect();
});
</script>

