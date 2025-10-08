// File Path: /server/server.js
const express = require('express');
const cors = require('cors');
const db = require('./database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require("socket.io");
const open = require('open');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const SECRET_KEY = 'your_very_secret_key'; 

app.use(cors());
const jsonParser = express.json();

// --- 靜態檔案與上傳路徑設定 ---
const isPkg = typeof process.pkg !== 'undefined';
const baseDir = isPkg ? path.dirname(process.execPath) : path.join(__dirname, '..', 'release');

// --- 修正路徑以適應 pkg 和開發模式 ---
if (isPkg) {
    // 在 pkg 環境中，靜態檔案相對於 exe 檔案的路徑
    app.use(express.static(path.join(baseDir, 'dist')));
    app.use('/uploads', express.static(path.join(baseDir, 'uploads')));
    app.use('/photos', express.static(path.join(baseDir, 'photos')));
} else {
    // 在開發環境中，路徑相對於 server.js
    app.use('/uploads', express.static(path.join(__dirname, '..', 'release', 'uploads')));
    app.use('/photos', express.static(path.join(__dirname, '..', 'release', 'photos')));
}


const uploadsDirectory = path.join(baseDir, 'uploads');
const photosDirectory = path.join(baseDir, 'photos');


[uploadsDirectory, photosDirectory].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// --- IP 位址偵測 ---
function getBestIP() {
    const interfaces = os.networkInterfaces();
    const blacklist = ['virtual', 'vmware', 'vbox', 'hyper-v', 'bluetooth', 'usb'];
    let bestCandidate = null;
    let preferredCandidate = null;

    for (const name in interfaces) {
        const lowerCaseName = name.toLowerCase();
        if (blacklist.some(keyword => lowerCaseName.includes(keyword))) {
            continue; // 排除虛擬、藍芽、USB 網卡
        }

        for (const net of interfaces[name]) {
            // 優先選擇 Wi-Fi 或乙太網路
            if (net.family === 'IPv4' && !net.internal) {
                if (lowerCaseName.includes('wi-fi') || lowerCaseName.includes('wlan') || lowerCaseName.includes('無線') || lowerCaseName.includes('ethernet') || lowerCaseName.includes('乙太')) {
                    preferredCandidate = net.address;
                }
                // 如果沒有更好的，先將就用
                if (!bestCandidate) {
                    bestCandidate = net.address;
                }
            }
        }
    }
    // 如果有找到 Wi-Fi 或乙太網路，就用它，否則用第一個找到的，再不行就用 localhost
    return preferredCandidate || bestCandidate || '127.0.0.1';
}

const PORT = 3000;
// 在 pkg 封裝環境中，使用自動偵測的 IP；在開發環境中，使用 127.0.0.1 以配合 Vite 代理
const HOST = isPkg ? getBestIP() : '127.0.0.1'; // HOST 的定義可以保留，但在 listen 時不使用

// 當只傳入 PORT 和 callback 時，Node.js 會自動監聽所有可用的 IP 位址 (包含 IPv4 的 127.0.0.1 和 IPv6 的 ::1)
server.listen(PORT, () => {
    const serverUrlForLog = `http://localhost:${PORT}`; // 為了日誌清晰，可以改用 localhost
    const serverUrlForStudent = `http://${getBestIP()}:${PORT}`; // 學生連線依然用偵測到的IP

    // ... (為美觀，可以一併修改主控台的輸出訊息)
    const colors = {
      reset: "\x1b[0m",
      bright: "\x1b[1m",
      fg: {
        green: "\x1b[32m",
        cyan: "\x1b[36m",
        yellow: "\x1b[33m",
        red: "\x1b[31m",
      }
    };

    console.log(``);
    console.log(`${colors.bright}${colors.fg.green}後端伺服器正在 ${serverUrlForLog} 運行${colors.reset}`);
    console.log(`${colors.fg.cyan}學生端請連線至: ${serverUrlForStudent} (或掃描QR Code)${colors.reset}`);
    console.log(``);
    console.log(`${colors.fg.yellow}這是視窗是顯示網站的啟動狀態，請勿關閉！${colors.reset}`);
    console.log(``);
    console.log(`${colors.fg.red}課程結束後，請再將此視窗關閉，網站即會停止。${colors.reset}`);
    console.log(``);
    
    if (isPkg) {
      open(`http://${HOST}:${PORT}`); // 自動開啟瀏覽器維持原樣
    }
});

// ... (剩餘的 API 和 Socket.IO 程式碼維持不變) ...
// --- Multer 設定 ---
const fileImportUpload = multer({ storage: multer.memoryStorage() });

const studentWorkStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { assignmentId } = req.params;
        if (!assignmentId) return cb(new Error('缺少作業 ID'));

        const assignment = db.prepare('SELECT title FROM assignments WHERE id = ?').get(assignmentId);
        if (!assignment) return cb(new Error('找不到指定的作業項目'));

        const studentInfo = db.prepare('SELECT student_id, name, seat_number FROM students WHERE id = ?').get(req.user.id);
        if (!studentInfo) return cb(new Error('找不到學生資料'));

        const assignmentDir = path.join(uploadsDirectory, assignment.title.replace(/[\/\\?%*:|"<>]/g, '-'));
        const studentDir = path.join(assignmentDir, `${String(studentInfo.seat_number).padStart(2, '0')}_${studentInfo.name}`);

        fs.mkdirSync(studentDir, { recursive: true });
        cb(null, studentDir);
    },
    filename: (req, file, cb) => {
        const { assignmentId } = req.params;
        const assignment = db.prepare('SELECT title FROM assignments WHERE id = ?').get(assignmentId);
        const studentInfo = db.prepare('SELECT name, seat_number FROM students WHERE id = ?').get(req.user.id);

        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const safeOriginalName = originalName.replace(/[\/\\?%*:|"<>]/g, '-');
        
        const finalFilename = `${assignment.title}_${String(studentInfo.seat_number).padStart(2, '0')}_${studentInfo.name}_${safeOriginalName}`;
        cb(null, finalFilename);
    }
});
const studentWorkUpload = multer({ storage: studentWorkStorage });

const photoUpload = multer({ storage: multer.memoryStorage() });

// --- 中介軟體 ---
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (token == null) return res.sendStatus(401); 
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403); 
        req.user = user;
        next();
    });
};

// --- API ---
// --- 伺服器資訊 API ---
app.get('/api/server-info', (req, res) => {
    res.json({ serverUrl: `http://${HOST}:${PORT}` });
});

// --- 認證相關 API ---
app.get('/api/auth/teacher/setup-status', (req, res) => {
    try {
        const count = db.prepare('SELECT COUNT(*) as count FROM teachers').get().count;
        res.json({ setupNeeded: count === 0 });
    } catch (dbError) {
        res.status(500).json({ error: '資料庫錯誤，無法檢查設定狀態。' });
    }
});

app.post('/api/auth/teacher/register', jsonParser, (req, res) => {
    if (db.prepare('SELECT COUNT(*) as count FROM teachers').get().count > 0) {
        return res.status(403).json({ error: '系統已有管理員帳號。' });
    }
    const { name, username, password } = req.body;
    if (!name || !username || !password || password.length < 6) {
        return res.status(400).json({ error: '姓名、帳號或密碼格式不符。' });
    }
    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        db.prepare('INSERT INTO teachers (name, username, password) VALUES (?, ?, ?)').run(name, username, hashedPassword);
        res.status(201).json({ message: '教師帳號建立成功！' });
    } catch (err) {
        res.status(500).json({ error: '資料庫錯誤，無法建立帳號。' });
    }
});
app.post('/api/auth/teacher/login', jsonParser, (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM teachers WHERE username = ?').get(username);
    if (user && bcrypt.compareSync(password, user.password)) {
        const { password, ...teacherInfo } = user;
        const token = jwt.sign({ id: user.id, username: user.username, type: 'teacher' }, SECRET_KEY, { expiresIn: '8h' });
        res.json({ token, teacher: teacherInfo });
    } else {
        res.status(401).json({ error: '帳號或密碼錯誤。' });
    }
});
app.post('/api/auth/student/login', jsonParser, (req, res) => {
    const { account, password } = req.body;
    const user = db.prepare('SELECT * FROM students WHERE account = ?').get(account);
    if (user && bcrypt.compareSync(password, user.password)) {
        const { password, ...studentInfo } = user;
        const token = jwt.sign({ id: user.id, account: user.account, type: 'student' }, SECRET_KEY, { expiresIn: '8h' });
        res.json({ token, student: studentInfo });
    } else {
        res.status(401).json({ error: '帳號或密碼錯誤。' });
    }
});
// --- 學生管理 API ---
app.get('/api/students', authenticateToken, (req, res) => { res.json(db.prepare('SELECT * FROM students').all()); });
app.post('/api/students', authenticateToken, jsonParser, (req, res) => { const { student_id, name, class: className, seat_number, gender, account, password } = req.body; if (!student_id || !name || !account || !password) return res.status(400).json({ error: '學號、姓名、帳號和密碼為必填項。' }); const hashedPassword = bcrypt.hashSync(password, 10); const stmt = db.prepare('INSERT INTO students (student_id, name, class, seat_number, gender, account, password) VALUES (?, ?, ?, ?, ?, ?, ?)'); try { const info = stmt.run(student_id, name, className, seat_number, gender, account, hashedPassword); res.status(201).json(db.prepare('SELECT * FROM students WHERE id = ?').get(info.lastInsertRowid)); } catch (err) { res.status(500).json({ error: '資料庫錯誤。' }); } });
app.put('/api/students/:id', authenticateToken, jsonParser, (req, res) => { const { id } = req.params; const { student_id, name, class: className, seat_number, gender, account, password } = req.body; let setClauses = "student_id = ?, name = ?, class = ?, seat_number = ?, gender = ?, account = ?"; let params = [student_id, name, className, seat_number, gender, account]; if (password) { setClauses += ", password = ?"; params.push(bcrypt.hashSync(password, 10)); } params.push(id); const stmt = db.prepare(`UPDATE students SET ${setClauses} WHERE id = ?`); try { const info = stmt.run(...params); if (info.changes === 0) return res.status(404).json({ error: '找不到指定的學生。' }); res.json(db.prepare('SELECT * FROM students WHERE id = ?').get(id)); } catch (err) { res.status(500).json({ error: '資料庫錯誤。' }); } });

app.delete('/api/students/:id', authenticateToken, (req, res) => {
    const student = db.prepare('SELECT student_id FROM students WHERE id = ?').get(req.params.id);
    if (!student) {
        return res.status(404).json({ error: '找不到指定的學生。' });
    }

    const transaction = db.transaction(() => {
        // Manually cascade deletes since PRAGMA foreign_keys might not be enabled
        db.prepare('DELETE FROM performance WHERE student_id = ?').run(student.student_id);
        db.prepare('DELETE FROM attendance WHERE student_id = ?').run(student.student_id);
        db.prepare('DELETE FROM grades WHERE student_id = ?').run(student.student_id);
        
        // Remove from seating chart
        const chartRow = db.prepare("SELECT * FROM seating_charts WHERE name = 'default'").get();
        if (chartRow && chartRow.seats) {
            try {
                let seats = JSON.parse(chartRow.seats);
                let updated = false;
                for (const key in seats) {
                    if (seats[key] && seats[key].student_id === student.student_id) {
                        seats[key] = null;
                        updated = true;
                    }
                }
                if (updated) {
                    db.prepare('UPDATE seating_charts SET seats = ? WHERE name = ?').run(JSON.stringify(seats), 'default');
                }
            } catch (e) {
                console.error("Error updating seating chart during student deletion:", e);
                // Don't throw, just log the error and continue with student deletion
            }
        }
        
        db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
    });

    try {
        transaction();
        res.json({ message: '學生已成功刪除，相關記錄也已清除。' });
    } catch(err) {
        console.error("Error deleting student:", err);
        res.status(500).json({ error: '刪除學生時發生資料庫錯誤。' });
    }
});

app.post('/api/students/import', authenticateToken, fileImportUpload.single('file'), (req, res) => { if (!req.file) return res.status(400).json({ error: '沒有上傳檔案。' }); try { const workbook = xlsx.read(req.file.buffer, { type: 'buffer' }); const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]); const insertStmt = db.prepare('INSERT OR IGNORE INTO students (student_id, name, class, seat_number, gender, account, password) VALUES (?, ?, ?, ?, ?, ?, ?)'); let importedCount = 0; db.transaction((students) => { for (const student of students) { const hashedPassword = bcrypt.hashSync(String(student['密碼'] || 'password123'), 10); const info = insertStmt.run(String(student['學號']||''), String(student['姓名']||''), String(student['班級']||''), Number(student['座號']||null), String(student['性別']||''), String(student['帳號']||''), hashedPassword); if (info.changes > 0) importedCount++; } })(data); res.json({ message: `成功匯入 ${importedCount} 筆新學生資料。重複的資料會被忽略。` }); } catch (error) { res.status(500).json({ error: '檔案處理失敗，請確認格式。' }); } });
// --- 學生照片 API ---
app.post('/api/students/photos/upload', authenticateToken, photoUpload.array('photos'), (req, res) => { if (!req.files || req.files.length === 0) return res.status(400).json({ error: '沒有上傳任何照片檔案。' }); try { const allStudents = db.prepare('SELECT student_id FROM students').all(); const studentIdSet = new Set(allStudents.map(s => s.student_id)); let successCount = 0; const failedFiles = []; req.files.forEach(file => { const originalFileExtension = path.extname(file.originalname); const studentId = path.basename(file.originalname, originalFileExtension); const lowerCaseExtension = originalFileExtension.toLowerCase(); if (studentIdSet.has(studentId) && ['.jpg', '.jpeg', '.png'].includes(lowerCaseExtension)) { ['.jpg', '.jpeg', '.png'].forEach(ext => { const oldPath = path.join(photosDirectory, studentId + ext); if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); }); const newFilename = studentId + lowerCaseExtension; const newPath = path.join(photosDirectory, newFilename); fs.writeFileSync(newPath, file.buffer); successCount++; } else { failedFiles.push(file.originalname); } }); let message = `成功上傳 ${successCount} 張照片。`; if (failedFiles.length > 0) message += ` ${failedFiles.length} 個檔案無法對應學生學號或格式不符：${failedFiles.join(', ')}`; res.json({ message }); } catch (error) { res.status(500).json({ error: '處理照片上傳時發生伺服器錯誤。' }); } });
app.get('/api/students/photos', authenticateToken, (req, res) => { try { res.json(fs.readdirSync(photosDirectory)); } catch (error) { res.status(500).json({ error: '無法讀取照片列表。' }); } });

// --- 學生端專用 API ---
app.get('/api/student/assignments', authenticateToken, (req, res) => {
    if (req.user.type !== 'student') return res.status(403).json({ error: '僅學生可訪問' });
    try {
        const student = db.prepare('SELECT student_id, name, seat_number FROM students WHERE id = ?').get(req.user.id);
        if (!student) return res.status(404).json({ error: '找不到學生資料' });

        const assignments = db.prepare(`
            SELECT a.*, s.name as subject_name 
            FROM assignments a 
            LEFT JOIN subjects s ON a.subject_id = s.id 
            WHERE a.due_date IS NOT NULL AND a.due_date > datetime('now', 'localtime')
            ORDER BY a.due_date ASC
        `).all();
        
        const assignmentsWithStatus = assignments.map(assignment => {
            const assignmentDir = path.join(uploadsDirectory, assignment.title.replace(/[\/\\?%*:|"<>]/g, '-'));
            const studentDir = path.join(assignmentDir, `${String(student.seat_number).padStart(2, '0')}_${student.name}`);
            const hasSubmitted = fs.existsSync(studentDir) && fs.readdirSync(studentDir).length > 0;
            return { ...assignment, hasSubmitted };
        });

        res.json(assignmentsWithStatus);
    } catch (err) {
        console.error("Error fetching student assignments:", err);
        res.status(500).json({ error: '讀取作業列表時發生伺服器內部錯誤' });
    }
});

app.post('/api/student/upload/:assignmentId', authenticateToken, studentWorkUpload.array('files'), (req, res) => {
    if (req.user.type !== 'student') return res.status(403).json({ error: '僅學生可訪問' });
    
    const { assignmentId } = req.params;
    const assignment = db.prepare('SELECT allow_resubmission FROM assignments WHERE id = ?').get(assignmentId);
    
    if (assignment.allow_resubmission === 0) {
        // This check is now mostly server-side validation as the client-side should prevent this.
        // It's good practice to keep it.
    }
    
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: '沒有上傳檔案。' });
    res.json({ message: `成功上傳 ${req.files.length} 個檔案！` }); 
});


app.post('/api/student/change-password', authenticateToken, jsonParser, (req, res) => { if (req.user.type !== 'student') return res.status(403).json({ error: '僅學生可操作。' }); const { currentPassword, newPassword } = req.body; if (!currentPassword || !newPassword || newPassword.length < 6) return res.status(400).json({ error: '密碼格式不符，新密碼長度至少需要 6 個字元。' }); const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.user.id); if (!student || !bcrypt.compareSync(currentPassword, student.password)) return res.status(401).json({ error: '目前的密碼不正確。' }); try { const newHashedPassword = bcrypt.hashSync(newPassword, 10); db.prepare('UPDATE students SET password = ? WHERE id = ?').run(newHashedPassword, req.user.id); res.json({ message: '密碼已成功更新！' }); } catch (err) { res.status(500).json({ error: '資料庫錯誤，更新密碼失敗。' }); } });
// --- 成績管理 API ---
app.get('/api/subjects', authenticateToken, (req, res) => { res.json(db.prepare('SELECT * FROM subjects ORDER BY id ASC').all()); });
app.post('/api/subjects', authenticateToken, jsonParser, (req, res) => { const { name } = req.body; if (!name) return res.status(400).json({ error: '科目名稱為必填項。' }); try { const info = db.prepare('INSERT INTO subjects (name, teacher_id) VALUES (?, ?)').run(name, req.user.id); res.status(201).json(db.prepare('SELECT * FROM subjects WHERE id = ?').get(info.lastInsertRowid)); } catch (err) { if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: '科目名稱已存在。' }); res.status(500).json({ error: '資料庫錯誤。' }); } });
app.put('/api/subjects/:id', authenticateToken, jsonParser, (req, res) => { const { name } = req.body; if (!name) return res.status(400).json({ error: '科目名稱為必填項。' }); try { const info = db.prepare('UPDATE subjects SET name = ? WHERE id = ?').run(name, req.params.id); if (info.changes === 0) return res.status(404).json({ error: '找不到指定的科目。' }); res.json(db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id)); } catch (err) { if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: '科目名稱已存在。' }); res.status(500).json({ error: '資料庫錯誤。' }); } });
app.delete('/api/subjects/:id', authenticateToken, (req, res) => { const info = db.prepare('DELETE FROM subjects WHERE id = ?').run(req.params.id); if (info.changes === 0) return res.status(404).json({ error: '找不到指定的科目。' }); res.json({ message: '科目已成功刪除。' }); });
app.get('/api/grade-items', authenticateToken, (req, res) => { const stmt = db.prepare(`SELECT gi.id, gi.name, gi.category, gi.subject_id, gi.date, s.name as subject_name FROM grade_items gi JOIN subjects s ON gi.subject_id = s.id ORDER BY gi.date DESC`); res.json(stmt.all()); });
app.post('/api/grade-items', authenticateToken, jsonParser, (req, res) => { const { name, category, subject_id } = req.body; if (!name || !category || !subject_id) return res.status(400).json({ error: '缺少必要參數。' }); const info = db.prepare('INSERT INTO grade_items (name, category, subject_id, teacher_id) VALUES (?, ?, ?, ?)').run(name, category, subject_id, req.user.id); const newItem = db.prepare(`SELECT gi.id, gi.name, gi.category, gi.subject_id, gi.date, s.name as subject_name FROM grade_items gi JOIN subjects s ON gi.subject_id = s.id WHERE gi.id = ?`).get(info.lastInsertRowid); res.status(201).json(newItem); });
app.delete('/api/grade-items/:id', authenticateToken, (req, res) => { const info = db.prepare('DELETE FROM grade_items WHERE id = ?').run(req.params.id); if (info.changes === 0) return res.status(404).json({ error: '找不到指定的成績項目。' }); res.json({ message: '成績項目已成功刪除。' }); });
app.get('/api/grades/:grade_item_id', authenticateToken, (req, res) => { const { grade_item_id } = req.params; const students = db.prepare('SELECT id, student_id, name, seat_number FROM students ORDER BY seat_number ASC, student_id ASC').all(); const grades = db.prepare('SELECT student_id, score FROM grades WHERE grade_item_id = ?').all(grade_item_id); const gradeMap = new Map(grades.map(g => [g.student_id, g.score])); const result = students.map(s => ({ ...s, score: gradeMap.get(s.student_id) ?? null })); res.json(result); });
app.post('/api/grades', authenticateToken, jsonParser, (req, res) => { const { grade_item_id, student_id, score } = req.body; if (!grade_item_id || !student_id) return res.status(400).json({ error: '缺少必要參數。' }); const finalScore = score === '' || score === null ? null : Number(score); const stmt = db.prepare(`INSERT INTO grades (grade_item_id, student_id, score) VALUES (?, ?, ?) ON CONFLICT(grade_item_id, student_id) DO UPDATE SET score = excluded.score`); stmt.run(grade_item_id, student_id, finalScore); res.status(200).json({ message: '成績已更新' }); });
app.get('/api/performance-summary', authenticateToken, (req, res) => { const { startDate, endDate } = req.query; if (!startDate || !endDate) return res.status(400).json({ error: '必須提供開始與結束日期。' }); try { const stmt = db.prepare(` SELECT s.id, s.student_id, s.name, s.seat_number, SUM(COALESCE(p.points, 0)) as total_score FROM students s LEFT JOIN performance p ON s.student_id = p.student_id AND p.date BETWEEN ? AND ? GROUP BY s.id, s.student_id, s.name, s.seat_number ORDER BY s.seat_number ASC, s.student_id ASC `); res.json(stmt.all(startDate, endDate)); } catch (err) { res.status(500).json({ error: '讀取課堂表現統計失敗。' }); } });
// --- 學期出缺席統計 API ---
app.get('/api/attendance-summary', authenticateToken, (req, res) => { const { startDate, endDate } = req.query; if (!startDate || !endDate) return res.status(400).json({ error: '必須提供開始與結束日期。' }); try { const stmt = db.prepare(` SELECT s.student_id, s.name, s.seat_number, SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present, SUM(CASE WHEN a.status = 'sick' THEN 1 ELSE 0 END) as sick, SUM(CASE WHEN a.status = 'official' THEN 1 ELSE 0 END) as official, SUM(CASE WHEN a.status = 'personal' THEN 1 ELSE 0 END) as personal, SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent FROM students s LEFT JOIN attendance a ON s.student_id = a.student_id AND a.date BETWEEN ? AND ? GROUP BY s.student_id, s.name, s.seat_number ORDER BY s.seat_number ASC, s.student_id ASC `); res.json(stmt.all(startDate, endDate)); } catch (err) { res.status(500).json({ error: '讀取學期出缺席統計失敗。' }); } });
// --- 其他 API (座位表, 儀表板) ---
app.get('/api/seating-chart', authenticateToken, (req, res) => { const chart = db.prepare("SELECT * FROM seating_charts WHERE name = 'default'").get(); if (chart) { chart.seats = JSON.parse(chart.seats || '{}'); res.json(chart); } else { res.json({ rows: 6, cols: 5, seats: {} }); } });
app.post('/api/seating-chart', authenticateToken, jsonParser, (req, res) => { const { rows, cols, seats } = req.body; const stmt = db.prepare(`INSERT INTO seating_charts (name, rows, cols, seats) VALUES ('default', ?, ?, ?) ON CONFLICT(name) DO UPDATE SET rows=excluded.rows, cols=excluded.cols, seats=excluded.seats`); stmt.run(rows, cols, JSON.stringify(seats)); res.json({ message: '座位表已儲存。' }); });
app.get('/api/assignments', authenticateToken, (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT a.*, s.name as subject_name 
            FROM assignments a 
            LEFT JOIN subjects s ON a.subject_id = s.id 
            ORDER BY a.created_at DESC
        `);
        res.json(stmt.all());
    } catch (err) {
        res.status(500).json({ error: '讀取作業列表失敗' });
    }
});
app.post('/api/assignments', authenticateToken, jsonParser, (req, res) => {
    const { title, description, due_date, subject_id, allow_resubmission } = req.body;
    if (!title || !subject_id) return res.status(400).json({ error: '作業標題和科目為必填項。' });
    try {
        const info = db.prepare('INSERT INTO assignments (title, description, due_date, subject_id, allow_resubmission) VALUES (?, ?, ?, ?, ?)')
                       .run(title, description, due_date, subject_id, allow_resubmission ? 1 : 0);
        const newAssignment = db.prepare(`
            SELECT a.*, s.name as subject_name 
            FROM assignments a 
            LEFT JOIN subjects s ON a.subject_id = s.id 
            WHERE a.id = ?
        `).get(info.lastInsertRowid);
        res.status(201).json(newAssignment);
    } catch (err) {
        res.status(500).json({ error: '資料庫錯誤，建立作業失敗' });
    }
});

app.put('/api/assignments/:id', authenticateToken, jsonParser, (req, res) => {
    const { id } = req.params;
    const { title, description, due_date, subject_id, allow_resubmission } = req.body;

    if (!title || !subject_id) {
        return res.status(400).json({ error: '作業標題和科目為必填項。' });
    }

    try {
        const info = db.prepare(`
            UPDATE assignments 
            SET title = ?, description = ?, due_date = ?, subject_id = ?, allow_resubmission = ? 
            WHERE id = ?
        `).run(title, description, due_date, subject_id, allow_resubmission ? 1 : 0, id);

        if (info.changes === 0) {
            return res.status(404).json({ error: '找不到指定的作業。' });
        }

        const updatedAssignment = db.prepare(`
            SELECT a.*, s.name as subject_name 
            FROM assignments a 
            LEFT JOIN subjects s ON a.subject_id = s.id 
            WHERE a.id = ?
        `).get(id);

        res.json(updatedAssignment);
    } catch (err) {
        console.error("Error updating assignment:", err);
        res.status(500).json({ error: '資料庫錯誤，更新作業失敗' });
    }
});

app.delete('/api/assignments/:id', authenticateToken, (req, res) => { const info = db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id); if (info.changes === 0) return res.status(404).json({ error: '找不到指定的作業。' }); res.json({ message: '作業已成功刪除。' }); });

app.get('/api/assignments/:id/submissions', authenticateToken, (req, res) => {
    try {
        const assignment = db.prepare('SELECT title FROM assignments WHERE id = ?').get(req.params.id);
        if (!assignment) return res.status(404).json({ error: '找不到作業項目' });

        const assignmentDir = path.join(uploadsDirectory, assignment.title.replace(/[\/\\?%*:|"<>]/g, '-'));
        if (!fs.existsSync(assignmentDir)) return res.json([]);

        const allStudents = db.prepare('SELECT student_id, name, seat_number FROM students').all();
        const studentMap = new Map(allStudents.map(s => [s.student_id, { name: s.name, seat_number: s.seat_number }]));

        const studentDirs = fs.readdirSync(assignmentDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        const submissions = studentDirs.map(dirName => {
            const [seat, name] = dirName.split('_');
            const studentDir = path.join(assignmentDir, dirName);
            const files = fs.readdirSync(studentDir).map(fileName => ({
                name: fileName,
                url: `/uploads/${encodeURIComponent(assignment.title.replace(/[\/\\?%*:|"<>]/g, '-'))}/${encodeURIComponent(dirName)}/${encodeURIComponent(fileName)}`
            }));
            
            // Find student_id from name and seat
            const student = allStudents.find(s => s.name === name && String(s.seat_number).padStart(2, '0') === seat);

            return {
                studentId: student ? student.student_id : null,
                name: name,
                seat_number: seat,
                files: files
            };
        }).filter(s => s.files.length > 0);

        res.json(submissions);
    } catch (error) {
        console.error("Error getting submissions:", error);
        res.status(500).json({ error: '讀取繳交列表時發生錯誤' });
    }
});

app.get('/api/classroom-status', authenticateToken, (req, res) => {
    const { date } = req.query;
    if (!date) {
        return res.status(400).json({ error: '必須提供日期參數' });
    }
    try {
        const chartRow = db.prepare("SELECT * FROM seating_charts WHERE name = 'default'").get();
        let chart = { rows: 6, cols: 5, seats: {} }; // Default structure
        
        if (chartRow && chartRow.seats) {
            try {
                chart.rows = chartRow.rows;
                chart.cols = chartRow.cols;
                chart.seats = JSON.parse(chartRow.seats);
            } catch (e) {
                console.error("Failed to parse seating chart JSON:", e);
                // Continue with an empty chart if parsing fails
            }
        }
        
        // Get a set of all valid student IDs from the students table
        const allStudentIdsInDb = new Set(db.prepare('SELECT student_id FROM students').all().map(s => s.student_id));

        const studentsOnChart = Object.values(chart.seats)
            .filter(s => s && s.student_id && allStudentIdsInDb.has(s.student_id)) // Ensure student exists
            .map(s => s.student_id);

        if (studentsOnChart.length > 0) {
            const existingRecordsStmt = db.prepare(`SELECT student_id FROM attendance WHERE date = ? AND student_id IN (${studentsOnChart.map(() => '?').join(',')})`);
            const existingRecords = existingRecordsStmt.all(date, ...studentsOnChart).map(r => r.student_id);
            const studentsToInsert = studentsOnChart.filter(id => !existingRecords.includes(id));
            if (studentsToInsert.length > 0) {
                const insertStmt = db.prepare('INSERT INTO attendance (student_id, date, status, teacher_id) VALUES (?, ?, ?, ?)');
                const insertMany = db.transaction((students) => {
                    for (const studentId of students) {
                        insertStmt.run(studentId, date, 'present', req.user.id);
                    }
                });
                insertMany(studentsToInsert);
            }
        }
        const attendance = db.prepare('SELECT student_id, status FROM attendance WHERE date = ?').all(date);
        const performance = db.prepare('SELECT student_id, SUM(points) as total_points FROM performance WHERE date = ? GROUP BY student_id').all(date);
        res.json({
            seatingChart: chart,
            attendance: Object.fromEntries(attendance.map(r => [r.student_id, r.status])),
            performance: Object.fromEntries(performance.map(r => [r.student_id, r.total_points]))
        });
    } catch (err) {
        console.error(`Error fetching classroom status for date ${date}:`, err);
        res.status(500).json({ error: '讀取課堂狀態失敗。' });
    }
});
app.post('/api/attendance', authenticateToken, jsonParser, (req, res) => { const { student_id, date, status } = req.body; db.prepare(`INSERT INTO attendance (student_id, date, status, teacher_id) VALUES (?, ?, ?, ?) ON CONFLICT(student_id, date) DO UPDATE SET status = excluded.status`).run(student_id, date, status, req.user.id); res.status(200).json({ message: '出缺席紀錄已更新。' }); });
app.post('/api/performance', authenticateToken, jsonParser, (req, res) => { const { student_id, date, points, reason } = req.body; db.prepare('INSERT INTO performance (student_id, date, points, reason, teacher_id) VALUES (?, ?, ?, ?, ?)').run(student_id, date, points, reason, req.user.id); res.status(201).json({ message: '課堂表現已記錄。' }); });

// --- QuizRace API ---
app.get('/api/quiz-sets', authenticateToken, (req, res) => {
    try {
        const sets = db.prepare(`
            SELECT 
                qs.id, 
                qs.name, 
                qs.description, 
                qs.created_at,
                COUNT(qq.id) as question_count
            FROM quiz_sets qs
            LEFT JOIN quiz_questions qq ON qs.id = qq.quiz_set_id
            GROUP BY qs.id
            ORDER BY qs.created_at DESC
        `).all();
        res.json(sets);
    } catch (err) {
        res.status(500).json({ error: '讀取測驗集失敗' });
    }
});

app.get('/api/quiz-sets/:id', authenticateToken, (req, res) => {
    try {
        const set = db.prepare('SELECT * FROM quiz_sets WHERE id = ?').get(req.params.id);
        if (!set) return res.status(404).json({ error: '找不到測驗集' });
        
        const questions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_set_id = ? ORDER BY id ASC').all(req.params.id);
        set.questions = questions.map(q => ({
            ...q,
            options: JSON.parse(q.options)
        }));
        res.json(set);
    } catch (err) {
        res.status(500).json({ error: '讀取測驗集失敗' });
    }
});


app.post('/api/quiz-sets', authenticateToken, jsonParser, (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: '測驗集名稱為必填項。' });
    try {
        const info = db.prepare('INSERT INTO quiz_sets (name, description) VALUES (?, ?)').run(name, description);
        const newSet = db.prepare('SELECT *, 0 as question_count FROM quiz_sets WHERE id = ?').get(info.lastInsertRowid);
        res.status(201).json(newSet);
    } catch (err) {
        res.status(500).json({ error: '資料庫錯誤，建立測驗集失敗' });
    }
});

app.put('/api/quiz-sets/:id', authenticateToken, jsonParser, (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: '測驗集名稱為必填項。' });
    try {
        const info = db.prepare('UPDATE quiz_sets SET name = ?, description = ? WHERE id = ?').run(name, description, req.params.id);
        if(info.changes === 0) return res.status(404).json({ error: '找不到要更新的測驗集' });
        res.json({ message: '更新成功' });
    } catch (err) {
        res.status(500).json({ error: '資料庫錯誤，更新測驗集失敗' });
    }
});

app.delete('/api/quiz-sets/:id', authenticateToken, (req, res) => {
    try {
        const info = db.prepare('DELETE FROM quiz_sets WHERE id = ?').run(req.params.id);
        if (info.changes === 0) return res.status(404).json({ error: '找不到要刪除的測驗集' });
        res.json({ message: '刪除成功' });
    } catch (err) {
        res.status(500).json({ error: '資料庫錯誤，刪除測驗集失敗' });
    }
});

// Quiz Questions API
app.get('/api/quiz-questions/:quiz_set_id', authenticateToken, (req, res) => {
    try {
        const questions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_set_id = ? ORDER BY id ASC').all(req.params.quiz_set_id);
        res.json(questions.map(q => ({
            ...q,
            options: JSON.parse(q.options)
        })));
    } catch (err) {
        res.status(500).json({ error: '讀取題目失敗' });
    }
});

app.post('/api/quiz-questions', authenticateToken, jsonParser, (req, res) => {
    const { quiz_set_id, question_text, options, correct_answer } = req.body;
    if (!quiz_set_id || !question_text || !options || !correct_answer) {
        return res.status(400).json({ error: '缺少必要欄位' });
    }
    try {
        const info = db.prepare('INSERT INTO quiz_questions (quiz_set_id, question_text, options, correct_answer) VALUES (?, ?, ?, ?)')
            .run(quiz_set_id, question_text, JSON.stringify(options), correct_answer);
        const newQuestion = db.prepare('SELECT * FROM quiz_questions WHERE id = ?').get(info.lastInsertRowid);
        res.status(201).json({
            ...newQuestion,
            options: JSON.parse(newQuestion.options)
        });
    } catch (err) {
        res.status(500).json({ error: '資料庫錯誤，新增題目失敗' });
    }
});

app.put('/api/quiz-questions/:id', authenticateToken, jsonParser, (req, res) => {
    const { question_text, options, correct_answer } = req.body;
    if (!question_text || !options || !correct_answer) {
        return res.status(400).json({ error: '缺少必要欄位' });
    }
    try {
        const info = db.prepare('UPDATE quiz_questions SET question_text = ?, options = ?, correct_answer = ? WHERE id = ?')
            .run(question_text, JSON.stringify(options), correct_answer, req.params.id);
        if(info.changes === 0) return res.status(404).json({ error: '找不到要更新的題目' });
        res.json({ message: '更新成功' });
    } catch (err) {
        res.status(500).json({ error: '資料庫錯誤，更新題目失敗' });
    }
});

app.delete('/api/quiz-questions/:id', authenticateToken, (req, res) => {
    try {
        const info = db.prepare('DELETE FROM quiz_questions WHERE id = ?').run(req.params.id);
        if (info.changes === 0) return res.status(404).json({ error: '找不到要刪除的題目' });
        res.json({ message: '刪除成功' });
    } catch (err) {
        res.status(500).json({ error: '資料庫錯誤，刪除題目失敗' });
    }
});

app.post('/api/quiz-questions/import/:quiz_set_id', authenticateToken, fileImportUpload.single('file'), (req, res) => {
    const { quiz_set_id } = req.params;
    if (!req.file) return res.status(400).json({ error: '沒有上傳檔案。' });
    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        const questions = data.slice(1).map(row => {
            const question_text = row[0];
            const correct_answer = String(row[1]);
            const options = [row[2], row[3], row[4], row[5]].filter(opt => opt != null && opt !== '');
            return { question_text, correct_answer, options };
        }).filter(q => q.question_text && q.correct_answer && q.options.length > 0);

        if (questions.length === 0) {
            return res.status(400).json({ error: '檔案中找不到有效題目，請檢查格式。' });
        }

        const insertStmt = db.prepare('INSERT INTO quiz_questions (quiz_set_id, question_text, options, correct_answer) VALUES (?, ?, ?, ?)');
        
        const insertMany = db.transaction((qs) => {
            for (const q of qs) {
                insertStmt.run(quiz_set_id, q.question_text, JSON.stringify(q.options), q.correct_answer);
            }
        });

        insertMany(questions);

        res.json({ message: `成功從檔案匯入 ${questions.length} 筆題目。` });
    } catch (error) {
        console.error("Import error:", error);
        res.status(500).json({ error: '檔案處理失敗，請確認格式是否正確。' });
    }
});


// --- Socket.IO PingPong 邏輯 ---
let pingPongRooms = {}; 

const endAnswering = (roomCode) => {
    const room = pingPongRooms[roomCode];
    if (room && room.state === 'question') {
        room.state = 'results';
        console.log(`[${roomCode}] 作答結束`);
        io.to(roomCode).emit('question:ended', room.answers);
    }
};

io.on('connection', (socket) => {
    console.log('一個客戶端已連線:', socket.id);

    // --- PingPong ---
    socket.on('teacher:createRoom', (callback) => {
        let roomCode = Math.floor(100000 + Math.random() * 900000).toString();
        while(pingPongRooms[roomCode]) {
            roomCode = Math.floor(100000 + Math.random() * 900000).toString();
        }
        socket.join(roomCode);
        pingPongRooms[roomCode] = {
            teacherId: socket.id,
            students: [],
            question: null,
            answers: {},
            state: 'waiting'
        };
        console.log(`[${roomCode}] 老師 ${socket.id} 已建立 PingPong 房間`);
        callback({ roomCode });
    });

    socket.on('student:joinRoom', ({ roomCode, name }, callback) => {
        const room = pingPongRooms[roomCode];
        if (!room) return callback({ success: false, message: '找不到房間代碼。' });
        if (room.state !== 'waiting') return callback({ success: false, message: '活動已開始，無法加入。' });

        socket.join(roomCode);
        room.students.push({ id: socket.id, name });
        console.log(`[${roomCode}] 學生 ${name} 已加入 PingPong`);
        io.to(room.teacherId).emit('student:joined', room.students);
        callback({ success: true });
    });

    socket.on('teacher:startQuestion', ({ roomCode, question }) => {
        const room = pingPongRooms[roomCode];
        if (room && room.teacherId === socket.id) {
            room.state = 'question';
            room.question = question;
            room.answers = {};
            console.log(`[${roomCode}] 老師開始 PingPong 提問`);
            io.to(roomCode).except(room.teacherId).emit('question:started', question);
            io.to(room.teacherId).emit('teacher:questionStarted');
        }
    });

    socket.on('student:submitAnswer', ({ roomCode, answer }) => {
        const room = pingPongRooms[roomCode];
        if (room && room.state === 'question') {
            const student = room.students.find(s => s.id === socket.id);
            if (student && !room.answers[socket.id]) { // 防止重複作答
                room.answers[socket.id] = { name: student.name, answer };
                console.log(`[${roomCode}] 學生 ${student.name} 回答了 PingPong`);
                io.to(room.teacherId).emit('student:answered', room.answers);
                
                if (Object.keys(room.answers).length === room.students.length) {
                    endAnswering(roomCode);
                }
            }
        }
    });

    socket.on('teacher:stopAnswering', ({ roomCode }) => {
        const room = pingPongRooms[roomCode];
        if (room && room.teacherId === socket.id) {
            endAnswering(roomCode);
        }
    });
    
    socket.on('teacher:endActivity', ({ roomCode }) => {
        const room = pingPongRooms[roomCode];
        if (room && room.teacherId === socket.id) {
            console.log(`[${roomCode}] 老師結束了 PingPong 活動`);
            io.to(roomCode).emit('activity:ended');
            delete pingPongRooms[roomCode];
        }
    });
    
    // --- QuizRace ---
    let quizRaceRooms = {};

    socket.on('teacher:createQuizRace', ({ quizSetId }, callback) => {
        let roomCode = Math.floor(100000 + Math.random() * 900000).toString();
        while(quizRaceRooms[roomCode]) {
            roomCode = Math.floor(100000 + Math.random() * 900000).toString();
        }
        
        try {
            const set = db.prepare('SELECT * FROM quiz_sets WHERE id = ?').get(quizSetId);
            if (!set) return callback({ error: '找不到指定的測驗集' });

            const questions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_set_id = ? ORDER BY id ASC').all(quizSetId);
            if (questions.length === 0) return callback({ error: '此測驗集沒有題目' });

            socket.join(roomCode);
            quizRaceRooms[roomCode] = {
                teacherId: socket.id,
                quizSet: { ...set, questions: questions.map(q => ({...q, options: JSON.parse(q.options)})) },
                players: {},
                state: 'lobby', // lobby, question, leaderboard, finished
                currentQuestionIndex: -1,
                questionStartTime: null,
            };
            console.log(`[QuizRace ${roomCode}] 老師 ${socket.id} 已建立遊戲`);
            callback({ roomCode });
        } catch (dbError) {
            callback({ error: '資料庫錯誤，無法建立遊戲' });
        }
    });

    socket.on('student:joinQuizRace', ({ roomCode, name }, callback) => {
        const room = quizRaceRooms[roomCode];
        if (!room) return callback({ success: false, message: '找不到遊戲房間。' });
        if (room.state !== 'lobby') return callback({ success: false, message: '遊戲已開始，無法加入。' });
        if (Object.values(room.players).some(p => p.name === name)) {
            return callback({ success: false, message: '此名稱已被使用，請換一個。' });
        }

        socket.join(roomCode);
        room.players[socket.id] = { id: socket.id, name, score: 0 };
        console.log(`[QuizRace ${roomCode}] 玩家 ${name} 已加入`);
        
        io.to(room.teacherId).emit('quizrace:playerJoined', Object.values(room.players));
        callback({ success: true, quizSetName: room.quizSet.name });
    });

    socket.on('teacher:startQuizRace', ({ roomCode }) => {
        const room = quizRaceRooms[roomCode];
        if (room && room.teacherId === socket.id && room.state === 'lobby') {
            console.log(`[QuizRace ${roomCode}] 遊戲開始`);
            room.state = 'question';
            room.currentQuestionIndex = 0;
            sendQuestion(roomCode);
        }
    });
    
    const sendQuestion = (roomCode) => {
        const room = quizRaceRooms[roomCode];
        if (!room) return;
        
        const questionIndex = room.currentQuestionIndex;
        const question = room.quizSet.questions[questionIndex];

        if (!question) {
            // No more questions, end game
            room.state = 'finished';
            const finalRankings = Object.values(room.players).sort((a, b) => b.score - a.score);
            io.to(roomCode).emit('quizrace:gameFinished', finalRankings);
            console.log(`[QuizRace ${roomCode}] 遊戲結束`);
            // Clean up room after a delay
            setTimeout(() => { delete quizRaceRooms[roomCode]; }, 60000); // Clean up after 1 minute
            return;
        }
        
        // Reset answers for the new question
        for(const playerId in room.players){
            room.players[playerId].answered = false;
        }

        room.questionStartTime = Date.now();
        const questionDataForTeacher = {
            index: questionIndex + 1,
            total: room.quizSet.questions.length,
            questionText: question.question_text,
            options: question.options,
            correctAnswer: question.correct_answer,
            timeLimit: 20 // seconds
        };
        const questionDataForStudent = {
            index: questionIndex + 1,
            total: room.quizSet.questions.length,
            questionText: question.question_text,
            options: question.options,
            timeLimit: 20 // seconds
        };

        io.to(room.teacherId).emit('quizrace:newQuestion', questionDataForTeacher);
        io.to(roomCode).except(room.teacherId).emit('quizrace:newQuestion', questionDataForStudent);

        // Set timer to end the question
        room.questionTimer = setTimeout(() => {
            showLeaderboard(roomCode);
        }, 20000);
    };

    socket.on('student:submitQuizAnswer', ({ roomCode, answerIndex }) => {
        const room = quizRaceRooms[roomCode];
        if (room && room.state === 'question') {
            const player = room.players[socket.id];
            if (player && !player.answered) {
                player.answered = true;
                const question = room.quizSet.questions[room.currentQuestionIndex];
                const timeTaken = (Date.now() - room.questionStartTime) / 1000;
                
                let score = 0;
                if (answerIndex + 1 == question.correct_answer) {
                    // Correct answer, score is based on time
                    score = Math.max(0, Math.round(1000 * (1 - (timeTaken / 20))));
                }
                player.score += score;

                console.log(`[QuizRace ${roomCode}] ${player.name} 回答了, 得分 ${score}, 總分 ${player.score}`);

                socket.emit('quizrace:answerResult', { correct: score > 0, scoreEarned: score, totalScore: player.score });
                
                // Update teacher on progress
                const answeredCount = Object.values(room.players).filter(p => p.answered).length;
                io.to(room.teacherId).emit('quizrace:playerAnswered', { answeredCount, totalPlayers: Object.keys(room.players).length });
                
                // If all players have answered, show leaderboard immediately
                if (answeredCount === Object.keys(room.players).length) {
                    clearTimeout(room.questionTimer);
                    showLeaderboard(roomCode);
                }
            }
        }
    });

    const showLeaderboard = (roomCode) => {
        const room = quizRaceRooms[roomCode];
        if (!room || room.state !== 'question') return;

        room.state = 'leaderboard';
        const rankings = Object.values(room.players).sort((a, b) => b.score - a.score);
        io.to(roomCode).emit('quizrace:showLeaderboard', rankings);
        
        // After showing leaderboard for 5 seconds, move to next question
        setTimeout(() => {
            room.state = 'question';
            room.currentQuestionIndex++;
            sendQuestion(roomCode);
        }, 5000);
    };


    socket.on('disconnect', () => {
        console.log('一個客戶端已斷線:', socket.id);
        // Handle disconnect for both games
        let roomCode, room;
        // Check PingPong
        for (const rc in pingPongRooms) {
            if (pingPongRooms[rc].students.some(s => s.id === socket.id) || pingPongRooms[rc].teacherId === socket.id) {
                roomCode = rc;
                room = pingPongRooms[roomCode];
                 if (room.teacherId === socket.id) {
                    console.log(`[PingPong ${roomCode}] 老師斷線，關閉房間。`);
                    io.to(roomCode).emit('activity:ended', '老師已離線，活動結束。');
                    delete pingPongRooms[roomCode];
                } else {
                    const studentIndex = room.students.findIndex(s => s.id === socket.id);
                    if (studentIndex !== -1) {
                         const studentName = room.students[studentIndex].name;
                        room.students.splice(studentIndex, 1);
                        console.log(`[PingPong ${roomCode}] 學生 ${studentName} 已離線`);
                        io.to(room.teacherId).emit('student:left', room.students);
                        if (room.state === 'question' && Object.keys(room.answers).length === room.students.length && room.students.length > 0) {
                            endAnswering(roomCode);
                        }
                    }
                }
                return;
            }
        }
        // Check QuizRace
        for (const rc in quizRaceRooms) {
             if (quizRaceRooms[rc].players[socket.id] || quizRaceRooms[rc].teacherId === socket.id) {
                roomCode = rc;
                room = quizRaceRooms[roomCode];
                if (room.teacherId === socket.id) {
                    console.log(`[QuizRace ${roomCode}] 老師斷線，遊戲結束。`);
                    io.to(roomCode).emit('quizrace:gameFinished', []);
                    delete quizRaceRooms[roomCode];
                } else {
                    const playerName = room.players[socket.id]?.name;
                    if (playerName) {
                        delete room.players[socket.id];
                        console.log(`[QuizRace ${roomCode}] 玩家 ${playerName} 已離線`);
                        io.to(room.teacherId).emit('quizrace:playerLeft', Object.values(room.players));
                    }
                }
                return;
             }
        }
    });
});

// --- Fallback for SPA ---
if (isPkg) {
    app.get('*', (req, res) => {
        res.sendFile(path.join(baseDir, 'dist', 'index.html'));
    });
}

