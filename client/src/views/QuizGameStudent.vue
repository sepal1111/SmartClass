<!-- File Path: /client/src/views/QuizGameStudent.vue -->
<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-sans">
    
    <!-- Join Game State -->
    <div v-if="!session.joined" class="w-full max-w-md">
       <div class="card bg-gray-800 p-8">
            <h1 class="text-3xl font-bold text-center text-yellow-300 mb-2">加入搶答競賽</h1>
            <p class="text-center text-gray-400 mb-8">請輸入老師提供的房間代碼</p>
            <form @submit.prevent="joinGame" class="space-y-6">
                <div>
                    <label for="roomCode" class="block text-lg font-bold text-gray-300 mb-1">房間代碼</label>
                    <input v-model.trim="form.roomCode" type="text" id="roomCode" placeholder="6 位數字"
                           class="form-input bg-gray-900 text-white border-gray-600 text-4xl tracking-widest text-center uppercase py-3">
                </div>
                <div>
                    <label for="studentName" class="block text-lg font-bold text-gray-300 mb-1">你的名字</label>
                    <input v-model.trim="form.name" type="text" id="studentName" placeholder="請輸入姓名或座號"
                           class="form-input bg-gray-900 text-white border-gray-600 text-2xl py-3">
                </div>
                <p v-if="error" class="text-red-400 text-sm text-center pt-2">{{ error }}</p>
                <button type="submit" class="w-full btn bg-green-500 hover:bg-green-600 py-4 text-2xl font-bold">
                    加入遊戲
                </button>
            </form>
        </div>
    </div>
    
    <!-- Lobby State -->
    <div v-if="session.joined && gameState === 'lobby'" class="text-center">
        <h2 class="text-4xl font-bold text-white">已成功加入！</h2>
        <p class="text-gray-400 mt-2 text-xl">請等待老師開始遊戲...</p>
        <div class="mt-12">
            <svg class="animate-spin h-16 w-16 text-yellow-300 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    </div>
    
    <!-- Question State -->
    <div v-if="gameState === 'question_open' && currentQuestion && !answerResult" class="w-full max-w-6xl mx-auto flex flex-col h-screen p-4">
        <div class="flex justify-between items-center text-2xl font-bold mb-4">
            <span>第 {{ questionIndex + 1 }} / {{ totalQuestions }} 題</span>
            <span>{{ timer }}</span>
        </div>
        <div class="flex-grow bg-white text-gray-900 flex items-center justify-center p-8 text-center rounded-lg text-4xl font-bold mb-4" v-html="currentQuestion.question_text || ''">
        </div>
        <div class="grid grid-cols-2 gap-4">
            <button v-for="(option, index) in currentQuestion.options" :key="index" @click="submitAnswer(index)"
                    class="p-8 rounded-lg text-3xl font-bold flex items-center justify-center h-40" :class="optionColors[index]">
                {{ option.text }}
            </button>
        </div>
    </div>

    <!-- Answer Result State -->
    <div v-if="answerResult" class="text-center">
        <div v-if="answerResult.isCorrect" class="text-green-400">
            <h1 class="text-6xl font-bold">正確！</h1>
            <p class="text-3xl mt-4">+{{ answerResult.points }} 分</p>
        </div>
        <div v-else class="text-red-400">
             <h1 class="text-6xl font-bold">答錯了</h1>
        </div>
        <p class="text-2xl text-gray-300 mt-8">目前總分: {{ myScore }}</p>
        <p class="text-xl text-gray-400 mt-4">等待其他玩家...</p>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { io } from 'socket.io-client';

const route = useRoute();
const router = useRouter();
const socket = ref(null);

const form = reactive({ roomCode: '', name: '' });
const session = reactive({ joined: false, playerId: null });
const error = ref('');
const gameState = ref('lobby');
const currentQuestion = ref(null);
const questionIndex = ref(0);
const totalQuestions = ref(0);
const timer = ref(0);
const timerInterval = ref(null);
const answerResult = ref(null);
const myScore = ref(0);

const optionColors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-400', 'bg-green-500'];

const joinGame = () => {
    if (!form.roomCode || !form.name) {
        error.value = '房間代碼和姓名為必填項。';
        return;
    }
    error.value = '';
    socket.value.emit('student:joinQuizRace', { roomCode: form.roomCode.toUpperCase(), name: form.name }, (response) => {
        if (response.success) {
            session.joined = true;
            session.playerId = response.playerId;
        } else {
            error.value = response.message;
        }
    });
};

const submitAnswer = (optionIndex) => {
    clearInterval(timerInterval.value);
    socket.value.emit('student:submitQuizAnswer', {
        roomCode: form.roomCode.toUpperCase(),
        optionIndex,
        timeRemaining: timer.value
    });
    // Optimistically disable buttons
    answerResult.value = { isCorrect: null, points: 0 }; // Placeholder
};

onMounted(() => {
    form.roomCode = route.query.room || '';
    const studentInfo = localStorage.getItem('studentInfo');
    if (studentInfo) form.name = JSON.parse(studentInfo).name;

    socket.value = io("http://localhost:3000");

    socket.value.on('connect', () => console.log("成功連接到 Socket.IO 伺服器"));

    socket.value.on('game:started', () => {
        gameState.value = 'question_open';
    });

    socket.value.on('question:new', (data) => {
        currentQuestion.value = data.question;
        questionIndex.value = data.questionIndex;
        totalQuestions.value = data.totalQuestions;
        timer.value = data.question.time_limit;
        gameState.value = 'question_open';
        answerResult.value = null;

        clearInterval(timerInterval.value);
        timerInterval.value = setInterval(() => {
            if (timer.value > 0) {
                timer.value--;
            } else {
                clearInterval(timerInterval.value);
                // Time's up, show a waiting message
                if (!answerResult.value) {
                    answerResult.value = { isCorrect: false, points: 0 };
                }
            }
        }, 1000);
    });

    socket.value.on('game:leaderboard', (data) => {
        gameState.value = 'leaderboard';
        const myPlayer = data.leaderboard.find(p => p.id === session.playerId);
        if (myPlayer) myScore.value = myPlayer.score;

        const myAnswer = socket.value.id in room.currentAnswers ? room.currentAnswers[socket.value.id].optionIndex : -1;
        
        if (myAnswer !== -1) {
            const isCorrect = myAnswer === data.correctOptionIndex;
            answerResult.value = {
                isCorrect: isCorrect,
                points: isCorrect ? room.currentAnswers[socket.value.id].points : 0
            }
        } else {
             answerResult.value = { isCorrect: false, points: 0 };
        }
    });

    socket.value.on('game:ended', () => {
        alert('遊戲結束了！');
        router.push({ name: 'auth' });
    });
});

onUnmounted(() => {
    if (socket.value) socket.value.disconnect();
    clearInterval(timerInterval.value);
});

</script>
