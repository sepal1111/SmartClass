<!-- File Path: /client/src/views/QuizGameTeacher.vue -->
<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-sans">
    
    <!-- 狀態一：載入中，正在建立房間 -->
    <div v-if="isLoading" class="text-center">
      <svg class="animate-spin h-12 w-12 text-yellow-300 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <h2 class="text-3xl font-bold mt-4">正在建立遊戲房間...</h2>
      <p class="text-gray-400 mt-2">請稍候</p>
    </div>

    <!-- 狀態二：遊戲大廳 (Lobby) -->
    <div v-else-if="gameState === 'lobby'" class="w-full max-w-5xl text-center">
      <h1 class="text-5xl font-bold text-yellow-300">遊戲大廳</h1>
      <p class="text-2xl text-gray-300 mt-4">請學生掃描 QR Code 或輸入以下房間代碼加入</p>
      
      <div class="mt-8 p-8 bg-gray-800 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-center gap-8">
        <div class="flex-shrink-0 p-3 bg-white rounded-lg">
           <img :src="qrCodeUrl" alt="QR Code" class="w-48 h-48 md:w-56 md:h-56">
        </div>
        <div class="text-left">
          <p class="text-3xl text-gray-400">房間代碼</p>
          <p class="text-8xl font-mono font-bold tracking-widest text-white">{{ roomCode }}</p>
          <button @click="startGame" class="mt-6 w-full btn bg-green-500 hover:bg-green-600 text-2xl px-12 py-4 rounded-full" :disabled="players.length === 0">
            {{ players.length === 0 ? '等待玩家加入...' : `開始遊戲 (${players.length}人)` }}
          </button>
        </div>
      </div>

      <div class="mt-8">
        <h2 class="text-3xl font-semibold">已加入的玩家:</h2>
        <div v-if="players.length === 0" class="text-gray-400 mt-4 text-lg">還沒有玩家加入...</div>
        <div v-else class="flex flex-wrap justify-center gap-4 mt-4 max-w-4xl mx-auto">
          <span v-for="(player, index) in players" :key="player.id" class="bg-gray-700 text-white px-4 py-2 rounded-full text-xl">
            <span class="font-bold text-sky-300">{{ index + 1 }}.</span> {{ player.name }}
          </span>
        </div>
      </div>
    </div>

     <!-- 狀態三：問題進行中 -->
    <div v-if="gameState === 'question' && currentQuestion" class="w-full max-w-6xl mx-auto flex flex-col h-full">
        <div class="flex justify-between items-center bg-gray-800 p-4 rounded-t-lg">
            <div class="text-2xl font-bold">第 {{ questionIndex + 1 }} / {{ totalQuestions }} 題</div>
            <div class="text-5xl font-bold text-yellow-300">{{ timer }}</div>
            <div class="text-2xl font-bold">{{ answersCount }} / {{ players.length }} 人已作答</div>
        </div>
        <div class="flex-grow bg-white text-gray-900 flex flex-col items-center justify-center p-8 text-center rounded-b-lg">
            <!-- *** 修正：使用 'text' 屬性來顯示題目文字 *** -->
            <div v-if="currentQuestion.text" v-html="currentQuestion.text" class="text-5xl font-bold"></div>
        </div>
        <div class="grid grid-cols-2 gap-4 p-4 mt-4">
            <!-- *** 修正：移除正確答案的醒目提示 *** -->
            <div v-for="(option, index) in currentQuestion.options" :key="index" 
                 class="p-6 rounded-lg text-3xl font-bold flex items-center transition-all duration-300" 
                 :class="[optionColors[index]]">
                <div class="text-5xl mr-6 font-black">{{ ['A', 'B', 'C', 'D'][index] }}</div>
                <div>{{ option }}</div>
            </div>
        </div>
    </div>
    
    <!-- 狀態四：排行榜 -->
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

     <!-- 狀態五：最終結果 -->
    <div v-if="gameState === 'finished'" class="w-full max-w-4xl mx-auto text-center">
        <h1 class="text-6xl font-bold text-yellow-300 mb-8">遊戲結束！</h1>
         <div class="space-y-4">
            <div v-for="(player, index) in leaderboard.slice(0, 3)" :key="player.id" 
                 class="p-6 rounded-lg flex items-center justify-between text-4xl"
                 :class="getPodiumClass(index)">
                <div class="flex items-center gap-4">
                    <span class="font-bold text-5xl w-16">{{ index + 1 }}</span>
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
import { useRoute, useRouter } from 'vue-router';
import { io } from 'socket.io-client';

const props = defineProps({
  setId: {
    type: String,
    required: true,
  },
});

const router = useRouter();
const socket = ref(null);
const isLoading = ref(true);
const roomCode = ref('');
const gameState = ref('lobby'); // lobby, question, leaderboard, finished
const players = ref([]);
const currentQuestion = ref(null);
const questionIndex = ref(0);
const totalQuestions = ref(0);
const timer = ref(15);
const timerInterval = ref(null);
const answersCount = ref(0);
const leaderboard = ref([]);

const optionColors = ['bg-red-600', 'bg-blue-600', 'bg-yellow-500', 'bg-green-600'];
const qrCodeUrl = computed(() => `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${window.location.origin}/quiz/play?room=${roomCode.value}`);
const isLastQuestion = computed(() => questionIndex.value >= totalQuestions.value - 1);

const getPodiumClass = (index) => {
    if (index === 0) return 'bg-yellow-400 text-gray-900 scale-110 shadow-lg';
    if (index === 1) return 'bg-gray-300 text-gray-900';
    if (index === 2) return 'bg-yellow-700 text-white';
    return 'bg-gray-800';
}

const startGame = () => {
    socket.value.emit('quiz:teacher:start', { roomCode: roomCode.value });
};

const nextQuestion = () => {
    socket.value.emit('quiz:teacher:nextQuestion', { roomCode: roomCode.value });
}

const backToManager = () => {
    router.push({ name: 'quiz-manager' });
}

onMounted(() => {
  socket.value = io("http://localhost:3000");

  socket.value.on('connect', () => {
    // *** 修正：使用正確的事件名稱 'quiz:teacher:create' ***
    socket.value.emit('quiz:teacher:create', { quizSetId: props.setId }, (response) => {
      isLoading.value = false;
      if (response.roomCode) {
        roomCode.value = response.roomCode;
      } else {
        alert(response.error || '無法建立遊戲室');
        router.back();
      }
    });
  });

  // *** 修正：使用正確的事件名稱 'quiz:updatePlayers' ***
  socket.value.on('quiz:updatePlayers', (playerList) => {
    players.value = playerList;
    answersCount.value = playerList.filter(p => p.answered).length;
  });

  // *** 修正：使用正確的事件名稱 'quiz:newQuestion' ***
  socket.value.on('quiz:newQuestion', (data) => {
      currentQuestion.value = data; 
      questionIndex.value = data.index;
      totalQuestions.value = data.total;
      timer.value = 15; // 可由後端設定
      answersCount.value = 0;
      gameState.value = 'question';

      clearInterval(timerInterval.value);
      timerInterval.value = setInterval(() => {
          if (timer.value > 0) {
              timer.value--;
          } else {
              clearInterval(timerInterval.value);
          }
      }, 1000);
  });
  
  // *** 修正：使用正確的事件名稱 'quiz:showLeaderboard' ***
  socket.value.on('quiz:showLeaderboard', (data) => {
      gameState.value = 'leaderboard';
      leaderboard.value = data;
      clearInterval(timerInterval.value);
  });
  
  // *** 修正：使用正確的事件名稱 'quiz:finished' ***
  socket.value.on('quiz:finished', (finalLeaderboard) => {
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

