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
                                <option value="multiple-choice">單選題 (4選1)</option>
                                <option value="true-false">是非題</option>
                                <option value="short-answer">簡答題</option>
                                <option value="image">繪圖題</option>
                            </select>
                        </div>
                        <div>
                           <label class="block text-sm font-medium text-gray-700">題目內容 (可選)</label>
                           <div class="mt-1 border border-gray-300 rounded-lg">
                               <div class="border-b bg-gray-50 p-2 flex items-center gap-3">
                                   <button @click="isDrawingModalOpen = true" class="text-sm bg-white hover:bg-gray-200 py-1 px-3 rounded-md shadow-sm">繪圖</button>
                                   <button @click="triggerImageUpload" class="text-sm bg-white hover:bg-gray-200 py-1 px-3 rounded-md shadow-sm">插入圖片</button>
                                   <input type="file" ref="imageUploader" @change="handleImageUpload" class="hidden" accept="image/*">
                               </div>
                               <div ref="questionEditor" contenteditable="true" class="w-full min-h-[120px] p-2 bg-white overflow-y-auto focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-b-lg" style="-webkit-user-modify: read-write-plaintext-only;"></div>
                           </div>
                        </div>

                        <!-- 正確答案設定 -->
                        <div v-if="question.type === 'multiple-choice'">
                            <label class="block text-sm font-medium text-gray-700">正確答案</label>
                            <div class="mt-2 flex space-x-2">
                                <button v-for="opt in ['A','B','C','D']" :key="opt" @click="question.correctAnswer = opt" :class="['w-12 h-12 rounded-full font-bold text-lg', question.correctAnswer === opt ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300']">{{ opt }}</button>
                            </div>
                        </div>
                         <div v-if="question.type === 'true-false'">
                            <label class="block text-sm font-medium text-gray-700">正確答案</label>
                            <div class="mt-2 flex space-x-2">
                                <button @click="question.correctAnswer = 'O'" :class="['px-6 py-2 rounded-md font-bold', question.correctAnswer === 'O' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300']">O (是)</button>
                                <button @click="question.correctAnswer = 'X'" :class="['px-6 py-2 rounded-md font-bold', question.correctAnswer === 'X' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300']">X (否)</button>
                            </div>
                        </div>

                        <button @click="startQuestion" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">
                            開始提問
                        </button>
                    </div>
                </div>

                <!-- 問題進行中... -->
                 <div v-if="activityState === 'question'">
                    <h2 class="text-xl font-semibold text-gray-800 mb-2">問題進行中...</h2>
                    <div class="p-4 border-2 border-indigo-500 rounded-lg bg-indigo-50" v-html="question.htmlContent"></div>
                     <p class="text-center my-4 text-gray-600">已作答人數: {{ Object.keys(answers).length }} / {{ connectedStudents.length }}</p>
                    
                     <button @click="stopAnswering" class="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg">
                        結束作答
                    </button>
                 </div>
            </div>
        </div>
        
        <!-- 全螢幕結果 Modal -->
        <div v-if="isResultsModalOpen" class="fixed inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center p-4 z-50">
            <div class="w-full max-w-6xl h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col p-6">
                <div class="flex justify-between items-center border-b pb-4 mb-4">
                    <h2 class="text-2xl font-bold">作答結果</h2>
                     <div class="flex items-center gap-4">
                        <button @click="exportResponses" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-sm">
                            匯出答題記錄
                        </button>
                        <button @click="closeResultsModal" class="text-2xl text-gray-500 hover:text-gray-800">&times;</button>
                    </div>
                </div>
                <div class="flex-grow overflow-y-auto">
                     <!-- 選擇/是非題 圖表 -->
                    <div v-if="finalQuestion.type === 'multiple-choice' || finalQuestion.type === 'true-false'" class="space-y-4 p-4">
                         <div v-for="stat in finalAnswerStats" :key="stat.option" class="w-full">
                           <div class="flex justify-between items-center mb-1">
                                <span class="font-semibold text-xl" :class="[stat.isCorrect ? 'text-green-600' : 'text-gray-700']">{{ stat.option }} {{ stat.isCorrect ? '✓' : '' }}</span>
                                <span class="text-lg">{{ stat.count }}人 ({{ stat.percentage }}%)</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-8">
                                <div class="h-8 rounded-full flex items-center justify-center text-white font-bold" :class="[stat.isCorrect ? 'bg-green-500' : 'bg-blue-500']" :style="{ width: stat.percentage + '%' }">{{ stat.percentage }}%</div>
                            </div>
                        </div>
                    </div>
                    <!-- 繪圖/文字題 縮圖 -->
                    <div v-if="finalQuestion.type === 'image' || finalQuestion.type === 'short-answer'" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                       <div v-for="ans in finalAnswers" :key="ans.id" @click="openResponseModal(ans)" class="p-2 border rounded-lg cursor-pointer hover:bg-gray-100 transition-all transform hover:scale-105">
                           <p class="text-md font-semibold text-center truncate">{{ ans.name }}</p>
                           <img v-if="finalQuestion.type === 'image'" :src="ans.answer" class="w-full h-auto rounded aspect-video object-contain bg-gray-200"/>
                           <p v-else class="text-sm p-2 bg-gray-100 rounded truncate h-24">{{ ans.answer }}</p>
                       </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 單一回應檢視 Modal (用於結果放大) -->
        <div v-if="isResponseModalOpen" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                 <div class="p-4 border-b flex justify-between items-center">
                    <h3 class="text-xl font-bold">{{ selectedResponse.name }} 的回應</h3>
                    <button @click="isResponseModalOpen = false" class="text-2xl text-gray-500 hover:text-gray-800">&times;</button>
                </div>
                <div class="p-6 overflow-y-auto flex-grow flex items-center justify-center">
                    <img v-if="finalQuestion.type === 'image'" :src="selectedResponse.answer" class="max-w-full max-h-full object-contain">
                    <p v-else class="text-2xl whitespace-pre-wrap">{{ selectedResponse.answer }}</p>
                </div>
            </div>
        </div>

        <!-- 繪圖 Modal -->
        <div v-if="isDrawingModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div class="bg-white rounded-lg shadow-xl p-4 w-full max-w-2xl">
                <h3 class="text-xl font-bold mb-2">繪製題目插圖</h3>
                <div class="bg-gray-200 p-2 rounded-t-lg flex items-center justify-center gap-2 flex-wrap">
                    <label class="text-sm">顏色: <input type="color" v-model="brushColor"></label>
                    <label class="text-sm">筆刷: <input type="range" v-model="brushSize" min="1" max="20"></label>
                </div>
                <canvas ref="drawingCanvas" class="border bg-white w-full aspect-[4/3]" style="touch-action: none;"></canvas>
                <div class="flex justify-end gap-2 mt-2">
                    <button @click="closeDrawingModal" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">取消</button>
                    <button @click="saveDrawing" class="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded">儲存繪圖</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, computed, watch, nextTick } from 'vue';
import { io } from 'socket.io-client';
import JSZip from 'jszip';

const socket = ref(null);
const roomCode = ref('');
const qrCodeUrl = computed(() => `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${window.location.origin}/pingpong-student?room=${roomCode.value}`);
const connectedStudents = ref([]);
const activityState = ref('waiting');
const question = reactive({ type: 'multiple-choice', htmlContent: '', correctAnswer: 'A' });
const answers = ref({});

// Refs for DOM elements
const questionEditor = ref(null);
const imageUploader = ref(null);
const drawingCanvas = ref(null);

// Modal 狀態
const isResponseModalOpen = ref(false);
const selectedResponse = ref({ name: '', answer: ''});
const isDrawingModalOpen = ref(false);
const isResultsModalOpen = ref(false);

// 最終結果狀態
const finalQuestion = ref({});
const finalAnswers = ref({});

// 繪圖狀態
const ctx = ref(null);
const isDrawing = ref(false);
const brushColor = ref('#ff0000');
const brushSize = ref(5);

const finalAnswerStats = computed(() => {
    if (!isResultsModalOpen.value || (finalQuestion.value.type !== 'multiple-choice' && finalQuestion.value.type !== 'true-false')) return [];

    const stats = {};
    const options = finalQuestion.value.type === 'multiple-choice' ? ['A', 'B', 'C', 'D'] : ['O', 'X'];
    options.forEach(opt => stats[opt] = 0);
    
    for (const studentId in finalAnswers.value) {
        const studentAnswer = finalAnswers.value[studentId].answer;
        if (stats[studentAnswer] !== undefined) stats[studentAnswer]++;
    }
    
    const totalAnswered = Object.keys(finalAnswers.value).length;
    return options.map(opt => ({
        option: opt,
        count: stats[opt],
        percentage: totalAnswered > 0 ? ((stats[opt] / totalAnswered) * 100).toFixed(0) : 0,
        isCorrect: opt === finalQuestion.value.correctAnswer
    }));
});

// --- Socket.IO ---
const createSession = () => socket.value.emit('teacher:createRoom', (res) => { if (res.roomCode) roomCode.value = res.roomCode; });
const startQuestion = () => { question.htmlContent = questionEditor.value.innerHTML; socket.value.emit('teacher:startQuestion', { roomCode: roomCode.value, question }); };
const stopAnswering = () => socket.value.emit('teacher:stopAnswering', { roomCode: roomCode.value });
const endActivity = () => { if (confirm('確定要結束活動嗎？')) { socket.value.emit('teacher:endActivity', { roomCode: roomCode.value }); roomCode.value = ''; }};

// --- Modals ---
const openResponseModal = (response) => { selectedResponse.value = response; isResponseModalOpen.value = true; };
const closeDrawingModal = () => { isDrawingModalOpen.value = false; clearCanvas(); };
const closeResultsModal = () => { isResultsModalOpen.value = false; activityState.value = 'results'; if(questionEditor.value) questionEditor.value.innerHTML = ''; };

// --- 繪圖邏輯 ---
const setupCanvas = () => { if (!drawingCanvas.value) return; ctx.value = drawingCanvas.value.getContext('2d'); const canvas = drawingCanvas.value; const rect = canvas.getBoundingClientRect(); canvas.width = rect.width; canvas.height = rect.height; canvas.addEventListener('mousedown', startDrawing); canvas.addEventListener('mousemove', draw); canvas.addEventListener('mouseup', stopDrawing); canvas.addEventListener('mouseleave', stopDrawing); canvas.addEventListener('touchstart', startDrawing, { passive: false }); canvas.addEventListener('touchmove', draw, { passive: false }); canvas.addEventListener('touchend', stopDrawing); };
const getPos = (e) => { const canvas = drawingCanvas.value; const rect = canvas.getBoundingClientRect(); const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height; const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }; };
const startDrawing = (e) => { e.preventDefault(); isDrawing.value = true; const {x, y} = getPos(e); ctx.value.beginPath(); ctx.value.moveTo(x, y); };
const draw = (e) => { if (!isDrawing.value) return; e.preventDefault(); const {x, y} = getPos(e); ctx.value.lineTo(x, y); ctx.value.strokeStyle = brushColor.value; ctx.value.lineWidth = brushSize.value; ctx.value.lineCap = 'round'; ctx.value.lineJoin = 'round'; ctx.value.stroke(); };
const stopDrawing = () => { if (!isDrawing.value) return; isDrawing.value = false; ctx.value.closePath(); };
const clearCanvas = () => ctx.value.clearRect(0, 0, drawingCanvas.value.width, drawingCanvas.value.height);
const saveDrawing = () => { const dataUrl = drawingCanvas.value.toDataURL('image/png'); const img = document.createElement('img'); img.src = dataUrl; questionEditor.value.appendChild(img); closeDrawingModal(); };

// --- 圖片上傳 ---
const triggerImageUpload = () => imageUploader.value.click();
const handleImageUpload = (e) => { const file = e.target.files[0]; if (!file) return; resizeImage(file, 800, 800, 0.8).then(dataUrl => { const img = document.createElement('img'); img.src = dataUrl; questionEditor.value.appendChild(img); }).catch(err => console.error("圖片處理失敗:", err)); e.target.value = ''; };
function resizeImage(file, maxWidth, maxHeight, quality) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = (event) => { const img = new Image(); img.onload = () => { let { width, height } = img; if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } } else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } } const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; canvas.getContext('2d').drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL(file.type, quality)); }; img.onerror = reject; img.src = event.target.result; }; reader.onerror = reject; reader.readAsDataURL(file); }); }

// --- 匯出功能 ---
const exportResponses = async () => {
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const answersArray = Object.values(finalAnswers.value);

    if (finalQuestion.value.type === 'image') {
        const zip = new JSZip();
        for (const res of answersArray) {
            const imageWithBg = await createImageWithBackground(res.answer);
            const blob = await (await fetch(imageWithBg)).blob();
            const fileName = `${res.name}_${timestamp}.png`;
            zip.file(fileName, blob);
        }
        const content = await zip.generateAsync({ type: "blob" });
        downloadFile(content, `繪圖作品_${roomCode.value}_${timestamp}.zip`);
    } else {
        let csvContent = "\uFEFF" + "學生暱稱,回答內容\n";
        answersArray.forEach(res => {
            const name = `"${res.name.replace(/"/g, '""')}"`;
            const answer = `"${String(res.answer).replace(/"/g, '""')}"`;
            csvContent += `${name},${answer}\n`;
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        downloadFile(blob, `答題記錄_${roomCode.value}_${timestamp}.csv`);
    }
};

const createImageWithBackground = (imageDataUrl) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.src = imageDataUrl;
    });
};

const downloadFile = (blob, fileName) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};


watch(isDrawingModalOpen, (isOpen) => { if (isOpen) nextTick(setupCanvas); });

onMounted(() => {
    socket.value = io("http://localhost:3000");
    socket.value.on('connect', () => console.log("成功連接到 Socket.IO 伺服器"));
    socket.value.on('student:joined', (students) => connectedStudents.value = students);
    socket.value.on('student:left', (students) => connectedStudents.value = students);
    socket.value.on('teacher:questionStarted', () => { activityState.value = 'question'; answers.value = {}; });
    socket.value.on('student:answered', (currentAnswers) => answers.value = currentAnswers);
    socket.value.on('question:ended', (finalResults) => {
        finalQuestion.value = { ...question };
        finalAnswers.value = finalResults;
        activityState.value = 'results';
        isResultsModalOpen.value = true;
    });
    socket.value.on('activity:ended', (message) => { alert(message || '活動已結束'); roomCode.value = ''; activityState.value = 'waiting'; });
});
onUnmounted(() => { if (socket.value) { if (roomCode.value) socket.value.emit('teacher:endActivity', { roomCode: roomCode.value }); socket.value.disconnect(); } });
</script>

<style>
#question-prompt-editor img {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
    display: block;
    margin: 0.5rem auto;
}
</style>

