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
const os = require('os');
const open = require('open');
const crypto = require('crypto');


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const SECRET_KEY = crypto.randomBytes(32).toString('hex');

app.use(cors());
const jsonParser = express.json();

// --- 靜態檔案與上傳路徑設定 ---
const isPkg = typeof process.pkg !== 'undefined';
const baseDir = isPkg ? path.dirname(process.execPath) : __dirname;
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
            continue;
        }

        for (const net of interfaces[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                if (lowerCaseName.includes('wi-fi') || lowerCaseName.includes('wlan') || lowerCaseName.includes('無線') || lowerCaseName.includes('ethernet') || lowerCaseName.includes('乙太')) {
                    preferredCandidate = net.address;
                }
                if (!bestCandidate) {
                    bestCandidate = net.address;
                }
            }
        }
    }
    return preferredCandidate || bestCandidate || '127.0.0.1';
}


const HOST = getBestIP();
const PORT = 3000;

if (isPkg) {
    app.use(express.static(path.join(baseDir, 'dist')));
} else {
    app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
}

app.use('/uploads', express.static(uploadsDirectory));
app.use('/photos', express.static(photosDirectory));

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

const quizImageUpload = multer({ storage: multer.memoryStorage() });


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

app.get('/api/server-info', (req, res) => {
    res.json({ url: `http://${HOST}:${PORT}` });
});

// --- 認證相關 API ---
app.get('/api/auth/teacher/setup-status', (req, res) => {
    res.json({ setupNeeded: db.prepare('SELECT COUNT(*) as count FROM teachers').get().count === 0 });
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

app.get('/api/auth/teacher/verify', authenticateToken, (req, res) => {
    const user = db.prepare('SELECT id, name, username FROM teachers WHERE id = ?').get(req.user.id);
    if (user) {
        res.json({ teacher: user });
    } else {
        res.status(404).json({ error: '找不到與此 token 相關聯的使用者。' });
    }
});

app.get('/api/auth/student/verify', authenticateToken, (req, res) => {
    if (req.user.type !== 'student') {
        return res.status(403).json({ error: '無效的憑證類型。' });
    }
    const user = db.prepare('SELECT id, name, student_id, account, class, seat_number, gender FROM students WHERE id = ?').get(req.user.id);
    if (user) {
        res.json({ student: user });
    } else {
        res.status(404).json({ error: '找不到與此 token 相關聯的學生。' });
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
        db.prepare('DELETE FROM performance WHERE student_id = ?').run(student.student_id);
        db.prepare('DELETE FROM attendance WHERE student_id = ?').run(student.student_id);
        db.prepare('DELETE FROM grades WHERE student_id = ?').run(student.student_id);
        
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
            ORDER BY a.created_at DESC
        `).all();
        
        const assignmentsWithStatus = assignments.map(assignment => {
            const assignmentDir = path.join(uploadsDirectory, assignment.title.replace(/[\/\\?%*:|"<>]/g, '-'));
            const studentDir = path.join(assignmentDir, `${String(student.seat_number).padStart(2, '0')}_${student.name}`);
            const hasSubmitted = fs.existsSync(studentDir) && fs.readdirSync(studentDir).length > 0;
            const isLate = hasSubmitted && fs.existsSync(path.join(studentDir, '_LATE.txt'));
            return { ...assignment, hasSubmitted, isLate };
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
    const assignment = db.prepare('SELECT title, due_date, allow_resubmission FROM assignments WHERE id = ?').get(assignmentId);
    
    if (assignment && assignment.due_date && new Date() > new Date(assignment.due_date)) {
        const studentInfo = db.prepare('SELECT name, seat_number FROM students WHERE id = ?').get(req.user.id);
        const assignmentDir = path.join(uploadsDirectory, assignment.title.replace(/[\/\\?%*:|"<>]/g, '-'));
        const studentDir = path.join(assignmentDir, `${String(studentInfo.seat_number).padStart(2, '0')}_${studentInfo.name}`);
        if (fs.existsSync(studentDir)) {
            fs.writeFileSync(path.join(studentDir, '_LATE.txt'), new Date().toISOString());
        }
    }
    
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: '沒有上傳檔案。' });
    res.json({ message: `成功上傳 ${req.files.length} 個檔案！` }); 
});


app.post('/api/student/change-password', authenticateToken, jsonParser, (req, res) => { if (req.user.type !== 'student') return res.status(403).json({ error: '僅學生可操作。' }); const { currentPassword, newPassword } = req.body; if (!currentPassword || !newPassword || newPassword.length < 6) return res.status(400).json({ error: '密碼格式不符，新密碼長度至少需要 6 個字元。' }); const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.user.id); if (!student || !bcrypt.compareSync(currentPassword, student.password)) return res.status(401).json({ error: '目前的密碼不正確。' }); try { const newHashedPassword = bcrypt.hashSync(newPassword, 10); db.prepare('UPDATE students SET password = ? WHERE id = ?').run(newHashedPassword, req.user.id); res.json({ message: '密碼已成功更新！' }); } catch (err) { res.status(500).json({ error: '資料庫錯誤，更新密碼失敗。' }); } });
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
app.get('/api/attendance-summary', authenticateToken, (req, res) => { const { startDate, endDate } = req.query; if (!startDate || !endDate) return res.status(400).json({ error: '必須提供開始與結束日期。' }); try { const stmt = db.prepare(` SELECT s.student_id, s.name, s.seat_number, SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present, SUM(CASE WHEN a.status = 'sick' THEN 1 ELSE 0 END) as sick, SUM(CASE WHEN a.status = 'official' THEN 1 ELSE 0 END) as official, SUM(CASE WHEN a.status = 'personal' THEN 1 ELSE 0 END) as personal, SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent FROM students s LEFT JOIN attendance a ON s.student_id = a.student_id AND a.date BETWEEN ? AND ? GROUP BY s.student_id, s.name, s.seat_number ORDER BY s.seat_number ASC, s.student_id ASC `); res.json(stmt.all(startDate, endDate)); } catch (err) { res.status(500).json({ error: '讀取學期出缺席統計失敗。' }); } });
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
        
        const baseUrl = `http://${HOST}:${PORT}`;

        const studentDirs = fs.readdirSync(assignmentDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        const submissions = studentDirs.map(dirName => {
            const [seat, name] = dirName.split('_');
            const studentDir = path.join(assignmentDir, dirName);
            const filesInDir = fs.readdirSync(studentDir);
            
            const isLate = filesInDir.includes('_LATE.txt');
            
            const files = filesInDir
                .filter(fileName => fileName !== '_LATE.txt')
                .map(fileName => ({
                    name: fileName,
                    url: `${baseUrl}/uploads/${encodeURIComponent(assignment.title.replace(/[\/\\?%*:|"<>]/g, '-'))}/${encodeURIComponent(dirName)}/${encodeURIComponent(fileName)}`
                }));
            
            const student = allStudents.find(s => s.name === name && String(s.seat_number).padStart(2, '0') === seat);

            return {
                studentId: student ? student.student_id : null,
                name: name,
                seat_number: seat,
                files: files,
                isLate: isLate
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
        let chart = { rows: 6, cols: 5, seats: {} }; 
        
        if (chartRow && chartRow.seats) {
            try {
                chart.rows = chartRow.rows;
                chart.cols = chartRow.cols;
                chart.seats = JSON.parse(chartRow.seats);
            } catch (e) {
                console.error("Failed to parse seating chart JSON:", e);
            }
        }
        
        const allStudentIdsInDb = new Set(db.prepare('SELECT student_id FROM students').all().map(s => s.student_id));

        const studentsOnChart = Object.values(chart.seats)
            .filter(s => s && s.student_id && allStudentIdsInDb.has(s.student_id)) 
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


// --- QuizRace APIs ---
app.get('/api/quiz-sets', authenticateToken, (req, res) => {
    try {
        const sets = db.prepare(`
            SELECT 
                qs.*, 
                s.name as subject_name,
                COUNT(qq.id) as question_count 
            FROM quiz_sets qs 
            LEFT JOIN subjects s ON qs.subject_id = s.id
            LEFT JOIN quiz_questions qq ON qs.id = qq.quiz_set_id 
            GROUP BY qs.id 
            ORDER BY qs.created_at DESC
        `).all();
        res.json(sets);
    } catch (err) {
        res.status(500).json({ error: "無法讀取測驗集" });
    }
});
app.post('/api/quiz-sets', authenticateToken, jsonParser, (req, res) => {
    const { title, subject_id } = req.body;
    if (!title) return res.status(400).json({ error: '測驗集標題為必填' });
    try {
        const info = db.prepare('INSERT INTO quiz_sets (title, subject_id, teacher_id) VALUES (?, ?, ?)').run(title, subject_id, req.user.id);
        const newSet = db.prepare(`
            SELECT qs.*, s.name as subject_name, 0 as question_count 
            FROM quiz_sets qs
            LEFT JOIN subjects s ON qs.subject_id = s.id
            WHERE qs.id = ?
        `).get(info.lastInsertRowid);
        res.status(201).json(newSet);
    } catch (err) {
        res.status(500).json({ error: '資料庫錯誤，無法建立測驗集' });
    }
});
app.put('/api/quiz-sets/:id', authenticateToken, jsonParser, (req, res) => {
    const { title, subject_id } = req.body;
    if (!title) return res.status(400).json({ error: '測驗集標題為必填' });
    try {
        const info = db.prepare('UPDATE quiz_sets SET title = ?, subject_id = ? WHERE id = ?').run(title, subject_id, req.params.id);
        if (info.changes === 0) return res.status(404).json({ error: '找不到測驗集' });
        const updatedSet = db.prepare(`
            SELECT qs.*, s.name as subject_name, (SELECT COUNT(*) FROM quiz_questions WHERE quiz_set_id = qs.id) as question_count
            FROM quiz_sets qs
            LEFT JOIN subjects s ON qs.subject_id = s.id
            WHERE qs.id = ?
        `).get(req.params.id);
        res.json(updatedSet);
    } catch (err) {
        res.status(500).json({ error: '資料庫錯誤，無法更新測驗集' });
    }
});
app.delete('/api/quiz-sets/:id', authenticateToken, (req, res) => {
    try {
        db.prepare('DELETE FROM quiz_sets WHERE id = ?').run(req.params.id);
        res.json({ message: '刪除成功' });
    } catch (err) {
        res.status(500).json({ error: '資料庫錯誤，無法刪除測驗集' });
    }
});
app.get('/api/quiz-questions/:quiz_set_id', authenticateToken, (req, res) => {
    try {
        const questions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_set_id = ? ORDER BY id ASC').all(req.params.quiz_set_id);
        res.json(questions);
    } catch (err) {
        res.status(500).json({ error: '無法讀取題目' });
    }
});
app.post('/api/quiz-questions', authenticateToken, jsonParser, (req, res) => {
    const { quiz_set_id, question_text, options, correct_answer } = req.body;
    try {
        const info = db.prepare('INSERT INTO quiz_questions (quiz_set_id, question_text, options, correct_answer) VALUES (?, ?, ?, ?)').run(quiz_set_id, question_text, JSON.stringify(options), correct_answer);
        const newQuestion = db.prepare('SELECT * FROM quiz_questions WHERE id = ?').get(info.lastInsertRowid);
        res.status(201).json(newQuestion);
    } catch (err) {
        res.status(500).json({ error: '資料庫錯誤，無法新增題目' });
    }
});
app.put('/api/quiz-questions/:id', authenticateToken, jsonParser, (req, res) => {
    const { question_text, options, correct_answer } = req.body;
    try {
        db.prepare('UPDATE quiz_questions SET question_text = ?, options = ?, correct_answer = ? WHERE id = ?').run(question_text, JSON.stringify(options), correct_answer, req.params.id);
        res.json({ message: '更新成功' });
    } catch (err) {
        res.status(500).json({ error: '資料庫錯誤，無法更新題目' });
    }
});
app.delete('/api/quiz-questions/:id', authenticateToken, (req, res) => {
    try {
        db.prepare('DELETE FROM quiz_questions WHERE id = ?').run(req.params.id);
        res.json({ message: '刪除成功' });
    } catch (err) {
        res.status(500).json({ error: '資料庫錯誤，無法刪除題目' });
    }
});

app.post('/api/quiz-questions/import/:quiz_set_id', authenticateToken, fileImportUpload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: '沒有上傳檔案。' });
    
    const { quiz_set_id } = req.params;

    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        data.shift(); 

        const questionsToInsert = [];
        const failedRows = [];

        data.forEach((row, index) => {
            const rowNumber = index + 2;
            const [question_text, correct_answer_index, opt1, opt2, opt3, opt4] = row;

            if (!question_text || String(question_text).trim() === '') {
                failedRows.push({ row: rowNumber, reason: '「題目文字」欄位為空' });
                return;
            }

            const options = [opt1, opt2, opt3, opt4].filter(opt => opt !== undefined && opt !== null && String(opt).trim() !== '');
            if (options.length < 2) {
                failedRows.push({ row: rowNumber, reason: '至少需要提供兩個有效選項' });
                return;
            }

            const correctAnswerNum = parseInt(correct_answer_index, 10);
            if (isNaN(correctAnswerNum) || correctAnswerNum < 1 || correctAnswerNum > options.length) {
                failedRows.push({ row: rowNumber, reason: `「正確答案」欄位 (${correct_answer_index}) 必須是 1 到 ${options.length} 之間的數字` });
                return;
            }

            const final_correct_answer_text = options[correctAnswerNum - 1];

            questionsToInsert.push({
                quiz_set_id: parseInt(quiz_set_id, 10),
                question_text: String(question_text).trim(),
                options: JSON.stringify(options),
                correct_answer: String(final_correct_answer_text)
            });
        });

        if (questionsToInsert.length > 0) {
            const insertStmt = db.prepare('INSERT INTO quiz_questions (quiz_set_id, question_text, options, correct_answer) VALUES (@quiz_set_id, @question_text, @options, @correct_answer)');
            const insertMany = db.transaction((questions) => {
                for (const question of questions) insertStmt.run(question);
            });
            insertMany(questionsToInsert);
        }

        let message = `處理完成！成功匯入 ${questionsToInsert.length} 筆題目。`;
        if (failedRows.length > 0) {
            const errorDetails = failedRows.map(f => `  - 第 ${f.row} 行: ${f.reason}`).join('\n');
            message += `\n\n有 ${failedRows.length} 筆資料匯入失敗：\n${errorDetails}`;
            return res.status(400).json({ error: message, details: failedRows });
        }
        
        res.json({ message });

    } catch (error) {
        console.error("匯入題庫時發生嚴重錯誤:", error);
        res.status(500).json({ error: '檔案處理失敗，請確認檔案為標準 Excel 格式 (.xlsx, .xls, .csv) 且內容無誤。' });
    }
});


// --- Socket.IO ---

// *** 關鍵修正：將 quizRaceRooms 移到全域範圍 ***
let pingPongRooms = {}; 
let quizRaceRooms = {};

const startNextQuestion = (roomCode) => {
    const room = quizRaceRooms[roomCode];
    if (!room) return;
    
    if (room.questionTimeout) clearTimeout(room.questionTimeout);
    if (room.leaderboardTimeout) clearTimeout(room.leaderboardTimeout);

    room.currentQuestionIndex++;
    if (room.currentQuestionIndex >= room.questions.length) {
        finishGame(roomCode);
        return;
    }

    room.state = 'question';
    Object.values(room.players).forEach(p => p.answered = false);

    const question = room.questions[room.currentQuestionIndex];
    
    const questionForStudent = {
        index: room.currentQuestionIndex,
        total: room.questions.length,
        text: question.question_text,
        options: JSON.parse(question.options),
    };
    const questionForTeacher = {
        ...questionForStudent,
        correct_answer: question.correct_answer,
    };
    
    io.to(room.teacherId).emit('quiz:newQuestion', questionForTeacher);
    io.to(roomCode).except(room.teacherId).emit('quiz:newQuestion', questionForStudent);
    
    room.questionStartTime = Date.now();

    room.questionTimeout = setTimeout(() => {
        if (room.state === 'question') {
            showLeaderboard(roomCode);
        }
    }, 15000);
};

const showLeaderboard = (roomCode) => {
    const room = quizRaceRooms[roomCode];
    if (!room || room.state !== 'question') return;
    
    if (room.questionTimeout) clearTimeout(room.questionTimeout);

    room.state = 'leaderboard';
    const leaderboard = Object.values(room.players)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

    io.to(roomCode).emit('quiz:showLeaderboard', leaderboard);
};

const finishGame = (roomCode) => {
    const room = quizRaceRooms[roomCode];
    if (!room) return;

    if (room.questionTimeout) clearTimeout(room.questionTimeout);
    if (room.leaderboardTimeout) clearTimeout(room.leaderboardTimeout);
    
    room.state = 'finished';
    const finalRankings = Object.values(room.players).sort((a, b) => b.score - a.score);
    io.to(roomCode).emit('quiz:finished', finalRankings);
    console.log(`[QuizRace ${roomCode}] 遊戲結束`);
    delete quizRaceRooms[roomCode];
};

io.on('connection', (socket) => {
    console.log('一個客戶端已連線:', socket.id);

    // --- PingPong Sockets ---
    const endAnswering = (roomCode) => {
      const room = pingPongRooms[roomCode];
      if (room && room.state === 'question') {
          room.state = 'results';
          io.to(roomCode).emit('question:ended', room.answers);
      }
    };
    socket.on('teacher:createRoom', (callback) => {
        let roomCode = Math.floor(100000 + Math.random() * 900000).toString();
        while(pingPongRooms[roomCode] || quizRaceRooms[roomCode]) {
            roomCode = Math.floor(100000 + Math.random() * 900000).toString();
        }
        socket.join(roomCode);
        pingPongRooms[roomCode] = { teacherId: socket.id, students: [], question: null, answers: {}, state: 'waiting' };
        callback({ roomCode });
    });
    socket.on('student:joinRoom', ({ roomCode, name }, callback) => { const room = pingPongRooms[roomCode]; if (!room) return callback({ success: false, message: '找不到房間' }); if (room.state !== 'waiting') return callback({ success: false, message: '活動已開始' }); socket.join(roomCode); room.students.push({ id: socket.id, name }); io.to(room.teacherId).emit('student:joined', room.students); callback({ success: true }); });
    socket.on('teacher:startQuestion', ({ roomCode, question }) => { const room = pingPongRooms[roomCode]; if (room && room.teacherId === socket.id) { room.state = 'question'; room.question = question; room.answers = {}; io.to(roomCode).except(room.teacherId).emit('question:started', question); io.to(room.teacherId).emit('teacher:questionStarted'); } });
    socket.on('student:submitAnswer', ({ roomCode, answer }) => { const room = pingPongRooms[roomCode]; if (room && room.state === 'question') { const student = room.students.find(s => s.id === socket.id); if (student && !room.answers[socket.id]) { room.answers[socket.id] = { name: student.name, answer }; io.to(room.teacherId).emit('student:answered', room.answers); if (Object.keys(room.answers).length === room.students.length) { endAnswering(roomCode); } } } });
    socket.on('teacher:stopAnswering', ({ roomCode }) => { const room = pingPongRooms[roomCode]; if (room && room.teacherId === socket.id) { endAnswering(roomCode); } });
    socket.on('teacher:endActivity', ({ roomCode }) => { const room = pingPongRooms[roomCode]; if (room && room.teacherId === socket.id) { io.to(roomCode).emit('activity:ended'); delete pingPongRooms[roomCode]; } });
    
    // --- QuizRace Sockets ---
    
    socket.on('quiz:teacher:create', ({ quizSetId }, callback) => {
        try {
            const questions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_set_id = ?').all(quizSetId);
            if (questions.length === 0) return callback({ error: '此題庫沒有題目' });

            let roomCode = Math.floor(100000 + Math.random() * 900000).toString();
            while (quizRaceRooms[roomCode] || pingPongRooms[roomCode]) {
                roomCode = Math.floor(100000 + Math.random() * 900000).toString();
            }

            socket.join(roomCode);
            quizRaceRooms[roomCode] = {
                teacherId: socket.id,
                questions: questions,
                players: {},
                state: 'lobby',
                currentQuestionIndex: -1,
                questionStartTime: 0,
            };
            console.log(`[QuizRace ${roomCode}] 遊戲已建立`);
            callback({ roomCode });
        } catch (e) { callback({ error: '建立遊戲失敗' }); }
    });
    
    socket.on('quiz:student:join', ({ roomCode, name }, callback) => {
        const room = quizRaceRooms[roomCode];
        if (!room) return callback({ success: false, message: '找不到房間' });
        if (room.state !== 'lobby') return callback({ success: false, message: '遊戲已開始' });
        if (Object.values(room.players).some(p => p.name === name)) return callback({ success: false, message: '名稱已被使用' });

        socket.join(roomCode);
        room.players[socket.id] = { name, score: 0, streak: 0, answered: false };
        io.to(roomCode).emit('quiz:updatePlayers', Object.values(room.players));
        callback({ success: true });
    });

    socket.on('quiz:teacher:start', ({ roomCode }) => {
        const room = quizRaceRooms[roomCode];
        if (room && room.teacherId === socket.id) {
            startNextQuestion(roomCode);
        }
    });
    
    socket.on('quiz:teacher:nextQuestion', ({ roomCode }) => {
        const room = quizRaceRooms[roomCode];
        if (room && room.teacherId === socket.id && room.state === 'leaderboard') {
            if (room.leaderboardTimeout) clearTimeout(room.leaderboardTimeout);
            startNextQuestion(roomCode);
        }
    });

    socket.on('quiz:student:answer', ({ roomCode, answer }) => {
        const room = quizRaceRooms[roomCode];
        if (!room || room.state !== 'question' || !room.players[socket.id] || room.players[socket.id].answered) return;

        const player = room.players[socket.id];
        const question = room.questions[room.currentQuestionIndex];
        const answerTime = Date.now() - room.questionStartTime;
        
        player.answered = true;
        const isCorrect = answer === question.correct_answer;

        if (isCorrect) {
            const timeBonus = Math.max(0, 1000 - Math.floor(answerTime / 15));
            const streakBonus = player.streak * 100;
            player.score += (1000 + timeBonus + streakBonus);
            player.streak++;
        } else { player.streak = 0; }

        socket.emit('quiz:answerResult', { isCorrect, score: player.score });
        
        io.to(roomCode).emit('quiz:updatePlayers', Object.values(room.players));
        
        const allAnswered = Object.values(room.players).every(p => p.answered);
        if (allAnswered) {
            if (room.questionTimeout) clearTimeout(room.questionTimeout);
            showLeaderboard(roomCode);
        }
    });

    socket.on('disconnect', () => {
        console.log('一個客戶端已斷線:', socket.id);
        
        // PingPong disconnect
        for (const roomCode in pingPongRooms) {
            const room = pingPongRooms[roomCode];
             if (room.teacherId === socket.id) {
                io.to(roomCode).emit('activity:ended', '老師已離線');
                delete pingPongRooms[roomCode];
                break;
            }
            const studentIndex = room.students.findIndex(s => s.id === socket.id);
            if (studentIndex > -1) {
                room.students.splice(studentIndex, 1);
                io.to(room.teacherId).emit('student:left', room.students);
                break;
            }
        }
        
        // QuizRace disconnect
        for (const roomCode in quizRaceRooms) {
            const room = quizRaceRooms[roomCode];
             if (room.teacherId === socket.id) {
                io.to(roomCode).emit('quiz:finished', []);
                delete quizRaceRooms[roomCode];
                break;
            }
            if (room.players[socket.id]) {
                delete room.players[socket.id];
                io.to(roomCode).emit('quiz:updatePlayers', Object.values(room.players));
                break;
            }
        }
    });
});


// --- 伺服器啟動 ---
server.listen(PORT, '0.0.0.0', () => {
    const serverUrl = `http://${HOST}:${PORT}`;
    const colors = { reset: "\x1b[0m", bright: "\x1b[1m", fg: { green: "\x1b[32m", yellow: "\x1b[33m", red: "\x1b[31m" } };
    console.log(`\n${colors.bright}${colors.fg.green}後端伺服器正在 ${serverUrl} 運行${colors.reset}`);
    console.log(`${colors.fg.yellow}學生端請連線至此網址，或掃描老師主畫面上的 QR Code${colors.reset}`);
    console.log(`${colors.fg.red}${colors.reset}\n`);
    console.log(`${colors.fg.green}這個視窗是顯示伺服器運行的狀態，請勿關閉！${colors.reset}\n`);
    console.log(`${colors.fg.red}${colors.reset}\n`);
    console.log(`${colors.fg.red}課程結束後，關閉此視窗，伺服器與網站即停止運作！${colors.reset}\n`);
    if (isPkg) { open(serverUrl); }
});

// Fallback for SPA
app.get('*', (req, res) => {
  const indexPath = isPkg ? path.join(baseDir, 'dist', 'index.html') : path.join(__dirname, '..', 'client', 'dist', 'index.html');
  res.sendFile(indexPath);
});

