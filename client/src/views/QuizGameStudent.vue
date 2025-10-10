<!-- File Path: /client/src/views/QuizGameStudent.vue -->
<template>
    <div class="min-h-screen bg-gray-800 text-white flex items-center justify-center p-4 font-sans">
      <!-- *** 修正：將最大寬度從 max-w-lg 調整為 max-w-2xl，讓整體區塊加寬 *** -->
      <div class="w-full max-w-2xl mx-auto">
  
        <!-- 狀態一：加入房間 -->
        <div v-if="gameState === 'joining'" class="card bg-gray-900 p-8 shadow-2xl">
          <h1 class="text-3xl font-bold text-center text-sky-400 mb-2">加入搶答競賽</h1>
          <p class="text-center text-gray-400 mb-8">請輸入老師提供的房間代碼</p>
          <form @submit.prevent="joinGame" class="space-y-6">
            <div>
              <label for="roomCode" class="block text-lg font-bold text-black mb-1 text-center">房間代碼</label>
              <!-- *** 修正：微調輸入框顏色，使其更融入深色主題 *** -->
              <input v-model.trim="form.roomCode" type="text" id="roomCode" placeholder="ABCDEF"
                     class="form-input bg-gray-800 border-gray-700 text-sky-400 font-bold text-4xl tracking-widest text-center uppercase py-3 focus:ring-yellow-400 focus:border-yellow-500">
            </div>
            <div>
              <label for="studentName" class="block text-lg font-bold text-black mb-1 text-center">你的名字</label>
              <input v-model.trim="form.name" type="text" id="studentName" placeholder="請輸入姓名或座號"
                     class="form-input bg-gray-800 border-gray-700 text-sky-400 font-bold text-2xl py-3 focus:ring-yellow-400 focus:border-yellow-500 text-center">
            </div>
            <p v-if="error" class="text-red-400 text-sm text-center pt-2">{{ error }}</p>
            <button type="submit" class="w-full btn bg-green-500 hover:bg-green-600 py-4 text-2xl font-bold">
              加入遊戲
            </button>
          </form>
        </div>
  
        <!-- 狀態二：等待遊戲開始 -->
        <div v-if="gameState === 'lobby'" class="text-center p-8 card bg-gray-900">
           <h2 class="text-4xl font-bold text-white">已成功加入！</h2>
           <p class="text-gray-400 mt-2 text-xl">請等待老師開始遊戲...</p>
           <div class="mt-12">
              <svg class="animate-spin h-16 w-16 text-yellow-300 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
           </div>
        </div>
        
        <!-- 狀態三：回答問題 -->
        <div v-if="gameState === 'question' && currentQuestion" class="w-full max-w-4xl mx-auto">
          <div class="flex justify-between items-center bg-gray-900 p-4 rounded-t-lg">
            <div class="text-2xl font-bold">第 {{ currentQuestion.index + 1 }} / {{ currentQuestion.total }} 題</div>
            <div class="text-5xl font-bold text-yellow-300">{{ timer }}</div>
          </div>
          <div class="p-8 bg-white text-gray-900 rounded-b-lg text-center">
              <p class="text-4xl font-bold">{{ currentQuestion.text }}</p>
          </div>
          <div class="mt-6 grid grid-cols-2 gap-4">
              <button v-for="(option, index) in currentQuestion.options" :key="index" @click="submitAnswer(option)" 
                      class="p-6 rounded-lg text-3xl font-bold flex items-center justify-center h-32 transition-transform transform hover:scale-105"
                      :class="optionColors[index]">
                  {{ option }}
              </button>
          </div>
        </div>
  
        <!-- 狀態四：等待結果 -->
        <div v-if="gameState === 'answered'" class="text-center p-8 card bg-gray-900">
          <svg class="mx-auto h-24 w-24 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
           <h2 class="mt-6 text-3xl font-bold text-white">已送出答案！</h2>
           <p class="text-gray-400 mt-2 text-lg">等待其他玩家...</p>
        </div>
  
        <!-- 狀態五：顯示排行榜/結果 -->
        <div v-if="gameState === 'leaderboard' || gameState === 'finished'" class="w-full max-w-2xl mx-auto text-center">
            <h1 class="text-5xl font-bold text-yellow-300 mb-8">{{ gameState === 'finished' ? '最終結果' : '即時排行榜' }}</h1>
            <div class="space-y-4">
                <div v-for="(player, index) in leaderboard" :key="player.id" class="bg-gray-700 p-4 rounded-lg flex justify-between items-center text-2xl">
                    <span class="font-bold">{{ index + 1 }}. {{ player.name }}</span>
                    <span class="font-semibold text-sky-300">{{ player.score }} 分</span>
                </div>
            </div>
            <div v-if="gameState === 'finished'" class="mt-8">
                <p class="text-2xl">遊戲結束！感謝參與！</p>
            </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
  import { useRoute } from 'vue-router';
  import { io } from 'socket.io-client';
  
  const socket = ref(null);
  const route = useRoute();
  const form = reactive({ roomCode: '', name: '' });
  const gameState = ref('joining'); // joining, lobby, question, answered, leaderboard, finished
  const error = ref('');
  const currentQuestion = ref(null);
  const timer = ref(0);
  const timerInterval = ref(null);
  const leaderboard = ref([]);
  const optionColors = ['bg-red-600', 'bg-blue-600', 'bg-yellow-500', 'bg-green-600'];
  
  const joinGame = () => {
    if (!form.roomCode || !form.name) {
      error.value = '房間代碼和姓名為必填項。';
      return;
    }
    error.value = '';
    socket.value.emit('quiz:student:join', { roomCode: form.roomCode.toUpperCase(), name: form.name }, (response) => {
      if (response.success) {
        gameState.value = 'lobby';
      } else {
        error.value = response.message;
      }
    });
  };
  
  const submitAnswer = (answer) => {
    socket.value.emit('quiz:student:answer', { roomCode: form.roomCode.toUpperCase(), answer });
    gameState.value = 'answered';
  };
  
  onMounted(() => {
    const roomFromUrl = route.query.room;
    if (roomFromUrl) {
      form.roomCode = roomFromUrl.toUpperCase();
    }
    const studentInfo = localStorage.getItem('studentInfo');
    if (studentInfo) {
      form.name = JSON.parse(studentInfo).name;
    }
    
    socket.value = io("http://localhost:3000");
  
    socket.value.on('connect', () => console.log("已連接到遊戲伺服器"));
    
    socket.value.on('quiz:newQuestion', (question) => {
      currentQuestion.value = question;
      timer.value = 15;
      gameState.value = 'question';
  
      clearInterval(timerInterval.value);
      timerInterval.value = setInterval(() => {
          if (timer.value > 0) timer.value--;
          else clearInterval(timerInterval.value);
      }, 1000);
    });
  
    socket.value.on('quiz:showLeaderboard', (board) => {
      leaderboard.value = board;
      gameState.value = 'leaderboard';
    });
  
    socket.value.on('quiz:finished', (rankings) => {
      leaderboard.value = rankings;
      gameState.value = 'finished';
      clearInterval(timerInterval.value);
    });
  });
  
  onUnmounted(() => {
    if (socket.value) socket.value.disconnect();
    clearInterval(timerInterval.value);
  });
  </script>
  
  