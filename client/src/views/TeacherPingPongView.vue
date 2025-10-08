<!-- File Path: /client/src/views/TeacherPingPongView.vue -->
<template>
    <div>
        <h1 class="text-4xl font-bold text-slate-800 mb-8">及時互動問答</h1>

        <!-- 狀態一：尚未建立活動 -->
        <div v-if="!roomCode" class="text-center p-10 card max-w-2xl mx-auto">
            <svg class="mx-auto h-24 w-24 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h2 class="mt-6 text-2xl font-semibold text-slate-700">開始一個新的問答活動</h2>
            <p class="mt-2 text-slate-500">點擊下方按鈕以產生一個活動房間代碼，讓學生可以加入。</p>
            <button @click="createSession" class="btn btn-primary text-xl px-8 py-4 rounded-full mt-8">
                建立新活動
            </button>
        </div>

        <!-- 狀態二：已建立活動，等待或進行中 -->
        <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- 左側：活動資訊與學生列表 -->
            <div class="lg:col-span-1 card flex flex-col">
                <h2 class="text-xl font-semibold text-slate-800">活動進行中</h2>
                <div class="mt-4 p-4 bg-slate-800 rounded-lg text-center">
                    <p class="text-sm text-slate-300">房間代碼</p>
                    <p class="text-5xl font-bold text-white tracking-widest">{{ roomCode }}</p>
                </div>
                 <div class="mt-4 flex justify-center">
                    <div class="p-2 border-4 border-slate-200 rounded-lg bg-white">
                        <img :src="qrCodeUrl" alt="QR Code" class="w-48 h-48">
                    </div>
                </div>
                <p class="text-center text-slate-500 mt-2 text-sm">請學生掃描 QR Code 或輸入代碼加入</p>

                <hr class="my-6">

                <h3 class="text-lg font-semibold text-slate-800 mb-2">已連線學生 ({{ connectedStudents.length }})</h3>
                <ul class="h-48 overflow-y-auto bg-slate-100 p-3 rounded-md border space-y-2 flex-grow">
                    <li v-for="student in connectedStudents" :key="student.id" class="text-slate-700 py-1 px-2 bg-white rounded shadow-sm">
                        {{ student.name }}
                    </li>
                     <li v-if="connectedStudents.length === 0" class="text-slate-400 text-center pt-10">尚無學生加入...</li>
                </ul>

                 <button @click="endActivity" class="btn btn-danger w-full mt-6 py-3 text-lg">
                    結束活動
                </button>
            </div>

            <!-- 右側：問題設定與結果顯示 -->
            <div class="lg:col-span-2 card">
                <!-- 問題設定區 -->
                <div v-if="activityState === 'waiting' || activityState === 'results'">
                     <h2 class="text-2xl font-semibold text-slate-800 mb-6">設定新問題</h2>
                    <div class="space-y-6">
                        <div>
                            <label class="block text-base font-medium text-slate-700">問題類型</label>
                            <select v-model="question.type" class="mt-1 form-input text-lg py-3">
                                <option value="multiple-choice">單選題 (4選1)</option>
                                <option value="true-false">是非題</option>
                                <option value="short-answer">簡答題</option>
                                <option value="image">繪圖題</option>
                            </select>
                        </div>
                        <div>
                           <label class="block text-base font-medium text-slate-700">題目內容 (可選)</label>
                           <div class="mt-1 border border-gray-300 rounded-lg">
                               <div class="border-b bg-slate-50 p-2 flex items-center gap-3">
                                   <button @click="isDrawingModalOpen = true" class="btn btn-secondary text-sm">繪圖</button>
                                   <button @click="triggerImageUpload" class="btn btn-secondary text-sm">插入圖片</button>
                                   <input type="file" ref="imageUploader" @change="handleImageUpload" class="hidden" accept="image/*">
                               </div>
                               <div ref="questionEditor" contenteditable="true" class="w-full min-h-[150px] p-3 text-lg bg-white overflow-y-auto focus:outline-none focus:ring-2 focus:ring-sky-400 rounded-b-lg" style="-webkit-user-modify: read-write-plaintext-only;"></div>
                           </div>
                        </div>

                        <!-- 正確答案設定 -->
                        <div v-if="question.type === 'multiple-choice'">
                            <label class="block text-base font-medium text-slate-700">正確答案</label>
                            <div class="mt-2 flex space-x-4">
                                <button v-for="opt in ['A','B','C','D']" :key="opt" @click="question.correctAnswer = opt" :class="['w-16 h-16 rounded-full font-bold text-2xl', question.correctAnswer === opt ? 'bg-green-500 text-white ring-2 ring-offset-2 ring-green-500' : 'bg-slate-200 text-slate-700 hover:bg-slate-300']">{{ opt }}</button>
                            </div>
                        </div>
                         <div v-if="question.type === 'true-false'">
                            <label class="block text-base font-medium text-slate-700">正確答案</label>
                            <div class="mt-2 flex space-x-4">
                                <button @click="question.correctAnswer = 'O'" :class="['px-8 py-4 rounded-lg font-bold text-2xl', question.correctAnswer === 'O' ? 'bg-green-500 text-white ring-2 ring-offset-2 ring-green-500' : 'bg-slate-200 text-slate-700 hover:bg-slate-300']">O (是)</button>
                                <button @click="question.correctAnswer = 'X'" :class="['px-8 py-4 rounded-lg font-bold text-2xl', question.correctAnswer === 'X' ? 'bg-red-500 text-white ring-2 ring-offset-2 ring-red-500' : 'bg-slate-200 text-slate-700 hover:bg-slate-300']">X (否)</button>
                            </div>
                        </div>

                        <button @click="startQuestion" class="btn bg-green-500 hover:bg-green-600 w-full text-xl py-4">
                            開始提問
                        </button>
                    </div>
                </div>

                <!-- 問題進行中... -->
                 <div v-if="activityState === 'question'">
                    <h2 class="text-2xl font-semibold text-slate-800 mb-4">問題進行中...</h2>
                    <div class="p-4 border-2 border-sky-500 rounded-lg bg-sky-50 min-h-[150px]" v-html="question.htmlContent"></div>
                     <p class="text-center my-6 text-2xl text-slate-600">已作答人數: <span class="font-bold text-sky-600 text-3xl">{{ Object.keys(answers).length }}</span> / {{ connectedStudents.length }}</p>
                    
                     <button @click="stopAnswering" class="btn btn-danger w-full text-xl py-4">
                        結束作答
                    </button>
                 </div>
            </div>
        </div>
        
        <!-- 全螢幕結果 Modal -->
        <div v-if="isResultsModalOpen" class="fixed inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center p-4 z-50">
            <div class="w-full max-w-7xl h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col p-6">
                <div class="flex justify-between items-center border-b pb-4 mb-6">
                    <h2 class="text-3xl font-bold">作答結果</h2>
                     <div class="flex items-center gap-4">
                        <button @click="exportResponses" class="btn btn-success text-base">
                            匯出答題記錄
                        </button>
                        <button @click="closeResultsModal" class="text-4xl text-slate-400 hover:text-slate-800">&times;</button>
                    </div>
                </div>
                <div class="flex-grow overflow-y-auto">
                     <!-- 選擇/是非題 圖表 -->
                    <div v-if="finalQuestion.type === 'multiple-choice' || finalQuestion.type === 'true-false'" class="space-y-6 p-4">
                         <div v-for="stat in finalAnswerStats" :key="stat.option" class="w-full">
                           <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold text-3xl flex items-center" :class="[stat.isCorrect ? 'text-green-600' : 'text-slate-700']">
                                    {{ stat.option }} 
                                    <svg v-if="stat.isCorrect" class="w-8 h-8 ml-2 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                                </span>
                                <span class="text-2xl font-bold">{{ stat.count }}人 ({{ stat.percentage }}%)</span>
                            </div>
                            <div class="w-full bg-slate-200 rounded-full h-12">
                                <div class="h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" :class="[stat.isCorrect ? 'bg-green-500' : 'bg-sky-500']" :style="{ width: stat.percentage + '%' }">{{ stat.percentage > 10 ? stat.percentage + '%' : '' }}</div>
                            </div>
                        </div>
                    </div>
                    <!-- 繪圖/文字題 縮圖 -->
                    <div v-if="finalQuestion.type === 'image' || finalQuestion.type === 'short-answer'" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                       <div v-for="ans in finalAnswers" :key="ans.id" @click="openResponseModal(ans)" class="card p-2 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all">
                           <p class="text-lg font-semibold text-center truncate mb-2">{{ ans.name }}</p>
                           <img v-if="finalQuestion.type === 'image'" :src="ans.answer" class="w-full rounded-md aspect-video object-contain bg-slate-100"/>
                           <p v-else class="text-base p-2 bg-slate-100 rounded h-32 overflow-hidden">{{ ans.answer }}</p>
                       </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 單一回應檢視 Modal (用於結果放大) -->
        <div v-if="isResponseModalOpen" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                 <div class="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-lg">
                    <h3 class="text-2xl font-bold">{{ selectedResponse.name }} 的回應</h3>
                    <button @click="isResponseModalOpen = false" class="text-4xl text-slate-400 hover:text-slate-800">&times;</button>
                </div>
                <div class="p-6 overflow-y-auto flex-grow flex items-center justify-center">
                    <img v-if="finalQuestion.type === 'image'" :src="selectedResponse.answer" class="max-w-full max-h-full object-contain">
                    <p v-else class="text-3xl whitespace-pre-wrap">{{ selectedResponse.answer }}</p>
                </div>
            </div>
        </div>

        <!-- 繪圖 Modal -->
        <div v-if="isDrawingModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div class="bg-white rounded-lg shadow-xl p-4 w-full max-w-3xl">
                <h3 class="text-2xl font-bold mb-4">繪製題目插圖</h3>
                <div class="bg-slate-100 p-2 rounded-t-lg flex items-center justify-center gap-4 flex-wrap">
                    <label class="text-base font-medium">顏色: <input type="color" v-model="brushColor"></label>
                    <label class="text-base font-medium flex items-center gap-2">筆刷: <input type="range" v-model="brushSize" min="1" max="50"></label>
                </div>
                <canvas ref="drawingCanvas" class="border bg-white w-full aspect-video" style="touch-action: none;"></canvas>
                <div class="flex justify-end gap-4 mt-4">
                    <button @click="closeDrawingModal" class="btn btn-secondary text-base">取消</button>
                    <button @click="saveDrawing" class="btn bg-teal-500 hover:bg-teal-600 text-base">儲存繪圖</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
// The script content remains largely the same, only template is updated.
import { ref, onMounted, onUnmounted, reactive, computed, watch, nextTick } from 'vue';
import { io } from 'socket.io-client';
import JSZip from 'jszip';

const socket = ref(null);
const roomCode = ref('');
const qrCodeUrl = computed(() => `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${window.location.origin}/pingpong-student?room=${roomCode.value}`);
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
const saveDrawing = () => { const dataUrl = drawingCanvas.value.toDataURL('image/png'); const img = document.createElement('img'); img.src = dataUrl; img.style.maxWidth = '100%'; img.style.maxHeight = '200px'; img.style.display = 'block'; img.style.margin = '0.5rem auto'; questionEditor.value.appendChild(img); closeDrawingModal(); };

// --- 圖片上傳 ---
const triggerImageUpload = () => imageUploader.value.click();
const handleImageUpload = (e) => { const file = e.target.files[0]; if (!file) return; resizeImage(file, 800, 800, 0.8).then(dataUrl => { const img = document.createElement('img'); img.src = dataUrl; img.style.maxWidth = '100%'; img.style.maxHeight = '200px'; img.style.display = 'block'; img.style.margin = '0.5rem auto'; questionEditor.value.appendChild(img); }).catch(err => console.error("圖片處理失敗:", err)); e.target.value = ''; };
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
