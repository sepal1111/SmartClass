<!-- File Path: /client/src/views/QuizGameTeacher.vue -->
<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-sans">
    
    <!-- Lobby State -->
    <div v-if="gameState === 'lobby'" class="text-center">
      <h1 class="text-3xl font-bold text-yellow-300">遊戲大廳</h1>
      <p class="text-gray-300 text-lg mt-2">請學生掃描 QR Code 或輸入房間代碼加入</p>
      <div class="my-8 flex flex-col md:flex-row items-center justify-center gap-8">
        <div class="p-4 bg-white rounded-lg">
           <img :src="qrCodeUrl" alt="QR Code" class="w-48 h-48 md:w-64 md:h-64">
        </div>
        <div>
          <p class="text-2xl text-gray-400">房間代碼</p>
          <p class="text-8xl font-bold tracking-widest">{{ roomCode }}</p>
        </div>
      </div>
      <button @click="startGame" class="btn bg-green-500 hover:bg-green-600 text-2xl px-12 py-4 rounded-full" :disabled="players.length === 0">
        {{ players.length === 0 ? '等待玩家加入...' : `開始遊戲 (${players.length})` }}
      </button>
      <div class="mt-8">
        <h2 class="text-xl font-semibold">已加入的玩家:</h2>
        <div class="flex flex-wrap justify-center gap-3 mt-4 max-w-4xl">
          <span v-for="player in players" :key="player.id" class="bg-gray-700 text-white px-4 py-2 rounded-full text-lg">{{ player.name }}</span>
        </div>
      </div>
    </div>

     <!-- Question State -->
    <div v-if="gameState === 'question_open' && currentQuestion" class="w-full max-w-6xl mx-auto flex flex-col h-full">
        <div class="flex justify-between items-center bg-gray-800 p-4 rounded-t-lg">
            <div class="text-2xl font-bold">第 {{ questionIndex + 1 }} / {{ totalQuestions }} 題</div>
            <div class="text-5xl font-bold text-yellow-300">{{ timer }}</div>
            <div class="text-2xl font-bold">{{ answersCount }} / {{ players.length }} 人已作答</div>
        </div>
        <div class="flex-grow bg-white text-gray-900 flex flex-col items-center justify-center p-8 text-center">
            <div v-if="currentQuestion.question_text" v-html="currentQuestion.question_text" class="text-4xl font-bold"></div>
        </div>
        <div class="grid grid-cols-2 gap-4 p-4 bg-gray-800 rounded-b-lg">
            <div v-for="(option, index) in currentQuestion.options" :key="index" class="p-6 rounded-lg text-2xl font-bold flex items-center" :class="optionColors[index]">
                <div class="text-4xl mr-4">{{ ['A', 'B', 'C', 'D'][index] }}</div>
                <div>{{ option.text }}</div>
            </div>
        </div>
    </div>
    
    <!-- Leaderboard State -->
    <div v-if="gameState === 'leaderboard'" class="w-full max-w-4xl mx-auto text-center">
        <h1 class="text-5xl font-bold text-yellow-300 mb-8">排行榜</h1>
        <div class="space-y-4">
            <div v-for="(player, index) in leaderboard" :key="player.id" class="bg-gray-800 p-4 rounded-lg flex items-center justify-between text-2xl">
                <div class="flex items-center">
                    <span class="font-bold w-12">{{ index + 1 }}.</span>
                    <span>{{ player.name }}</span>
                </div>
                <span class="font-bold text-yellow-300">{{ player.score }} 分</span>
            </div>
        </div>
        <button @click="nextQuestion" class="btn btn-primary text-2xl px-12 py-4 rounded-full mt-10">
          {{ isLastQuestion ? '查看最終結果' : '下一題' }}
        </button>
    </div>

     <!-- Final Results State -->
    <div v-if="gameState === 'finished'" class="w-full max-w-4xl mx-auto text-center">
        <h1 class="text-6xl font-bold text-yellow-300 mb-8">遊戲結束！</h1>
         <div class="space-y-4">
            <div v-for="(player, index) in leaderboard.slice(0, 3)" :key="player.id" 
                 class="p-6 rounded-lg flex items-center justify-between text-3xl"
                 :class="getPodiumClass(index)">
                <div class="flex items-center">
                    <span class="font-bold text-4xl w-16">{{ index + 1 }}</span>
                    <span>{{ player.name }}</span>
                </div>
                <span class="font-bold">{{ player.score }} 分</span>
            </div>
        </div>
        <button @click="backToManager" class="btn btn-secondary text-2xl px-12 py-4 rounded-full mt-12">返回題庫管理</button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { io } from 'socket.io-client';

const props = defineProps({
  setId: {
    type: String,
    required: true,
  },
});

const router = useRouter();
const socket = ref(null);
const roomCode = ref('');
const gameState = ref('lobby'); // lobby, question_open, leaderboard, finished
const players = ref([]);
const currentQuestion = ref(null);
const questionIndex = ref(0);
const totalQuestions = ref(0);
const timer = ref(0);
const timerInterval = ref(null);
const answersCount = ref(0);
const leaderboard = ref([]);

const optionColors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-400', 'bg-green-500'];
const qrCodeUrl = computed(() => `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${window.location.origin}/quiz/play?room=${roomCode.value}`);
const isLastQuestion = computed(() => questionIndex.value >= totalQuestions.value - 1);

const getPodiumClass = (index) => {
    if (index === 0) return 'bg-yellow-400 text-gray-900';
    if (index === 1) return 'bg-gray-300 text-gray-900';
    if (index === 2) return 'bg-yellow-700 text-white';
    return 'bg-gray-800';
}

const startGame = () => {
    socket.value.emit('teacher:startQuizRace', { roomCode: roomCode.value });
};

const nextQuestion = () => {
    socket.value.emit('teacher:nextQuestion', { roomCode: roomCode.value });
}

const backToManager = () => {
    router.push({ name: 'quiz-manager' });
}

onMounted(() => {
  socket.value = io("http://localhost:3000");

  socket.value.on('connect', () => {
    socket.value.emit('teacher:createQuizRace', { quizSetId: props.setId }, (response) => {
      if (response.roomCode) {
        roomCode.value = response.roomCode;
      } else {
        alert(response.error || '無法建立遊戲室');
        router.back();
      }
    });
  });

  socket.value.on('player:joined', (playerList) => {
    players.value = playerList;
  });
  
  socket.value.on('player:left', (playerList) => {
    players.value = playerList;
  });

  socket.value.on('game:started', () => {
    gameState.value = 'question_open';
  });

  socket.value.on('question:new', (data) => {
      currentQuestion.value = data.question;
      questionIndex.value = data.questionIndex;
      totalQuestions.value = data.totalQuestions;
      timer.value = data.question.time_limit;
      answersCount.value = 0;
      gameState.value = 'question_open';

      clearInterval(timerInterval.value);
      timerInterval.value = setInterval(() => {
          if (timer.value > 0) {
              timer.value--;
          } else {
              clearInterval(timerInterval.value);
          }
      }, 1000);
  });

  socket.value.on('player:answered', () => {
      answersCount.value++;
  });

  socket.value.on('game:leaderboard', (data) => {
      gameState.value = 'leaderboard';
      leaderboard.value = data.leaderboard;
      clearInterval(timerInterval.value);
  });
  
  socket.value.on('game:ended', (finalLeaderboard) => {
      gameState.value = 'finished';
      leaderboard.value = finalLeaderboard;
  });

});

onUnmounted(() => {
  if (socket.value) {
    socket.value.disconnect();
  }
  clearInterval(timerInterval.value);
});
</script>
