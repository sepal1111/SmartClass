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

const app = express();
const SECRET_KEY = 'your_very_secret_key'; 

app.use(cors());

const jsonParser = express.json();

// --- 靜態檔案與上傳路徑設定 ---
const isPkg = typeof process.pkg !== 'undefined';
const uploadsDirectory = isPkg
    ? path.join(path.dirname(process.execPath), 'uploads')
    : path.resolve(__dirname, 'uploads');

if (!fs.existsSync(uploadsDirectory)) {
    fs.mkdirSync(uploadsDirectory, { recursive: true });
}
app.use('/uploads', express.static(uploadsDirectory));

// --- Multer 檔案上傳設定 ---
const fileImportUpload = multer({ storage: multer.memoryStorage() });

const studentWorkUpload = multer({ 
    storage: multer.diskStorage({
        destination: uploadsDirectory,
        filename: (req, file, cb) => {
            const studentDbId = req.user.id;
            const stmt = db.prepare('SELECT student_id, name FROM students WHERE id = ?');
            const studentInfo = stmt.get(studentDbId);
            if (!studentInfo) {
                return cb(new Error('找不到學生資料，無法命名檔案。'), null);
            }
            const originalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
            const newFilename = `${studentInfo.student_id}_${studentInfo.name}_${originalName}`;
            cb(null, newFilename);
        }
    }) 
});

// --- 中介軟體 (Middleware) ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401); 

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403); 
        req.user = user;
        next();
    });
};

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
app.get('/api/students', authenticateToken, (req, res) => {
    res.json(db.prepare('SELECT * FROM students').all());
});

app.post('/api/students', authenticateToken, jsonParser, (req, res) => {
    const { student_id, name, class: className, seat_number, gender, account, password } = req.body;
    if (!student_id || !name || !account || !password) {
        return res.status(400).json({ error: '學號、姓名、帳號和密碼為必填項。' });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO students (student_id, name, class, seat_number, gender, account, password) VALUES (?, ?, ?, ?, ?, ?, ?)');
    try {
        const info = stmt.run(student_id, name, className, seat_number, gender, account, hashedPassword);
        res.status(201).json(db.prepare('SELECT * FROM students WHERE id = ?').get(info.lastInsertRowid));
    } catch (err) {
        res.status(500).json({ error: '資料庫錯誤。' });
    }
});

app.put('/api/students/:id', authenticateToken, jsonParser, (req, res) => {
    const { id } = req.params;
    const { student_id, name, class: className, seat_number, gender, account, password } = req.body;
    let setClauses = "student_id = ?, name = ?, class = ?, seat_number = ?, gender = ?, account = ?";
    let params = [student_id, name, className, seat_number, gender, account];
    if (password) {
        setClauses += ", password = ?";
        params.push(bcrypt.hashSync(password, 10));
    }
    params.push(id);
    const stmt = db.prepare(`UPDATE students SET ${setClauses} WHERE id = ?`);
    try {
        const info = stmt.run(...params);
        if (info.changes === 0) return res.status(404).json({ error: '找不到指定的學生。' });
        res.json(db.prepare('SELECT * FROM students WHERE id = ?').get(id));
    } catch (err) {
        res.status(500).json({ error: '資料庫錯誤。' });
    }
});

app.delete('/api/students/:id', authenticateToken, (req, res) => {
    const info = db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: '找不到指定的學生。' });
    res.json({ message: '學生已成功刪除。' });
});

app.post('/api/students/import', authenticateToken, fileImportUpload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: '沒有上傳檔案。' });
    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        const insertStmt = db.prepare('INSERT OR IGNORE INTO students (student_id, name, class, seat_number, gender, account, password) VALUES (?, ?, ?, ?, ?, ?, ?)');
        let importedCount = 0;
        db.transaction((students) => {
            for (const student of students) {
                // *** 修正：讀取 Excel 中的密碼，若無則使用預設值 ***
                const passwordToHash = String(student['密碼'] || 'password123');
                const hashedPassword = bcrypt.hashSync(passwordToHash, 10);

                const info = insertStmt.run(
                    String(student['學號']||''), 
                    String(student['姓名']||''), 
                    String(student['班級']||''), 
                    Number(student['座號']||null), 
                    String(student['性別']||''), 
                    String(student['帳號']||''), 
                    hashedPassword // 使用來自 Excel 或預設的加密後密碼
                );
                if (info.changes > 0) importedCount++;
            }
        })(data);
        res.json({ message: `成功匯入 ${importedCount} 筆新學生資料。重複的資料會被忽略。` });
    } catch (error) {
        res.status(500).json({ error: '檔案處理失敗，請確認格式。' });
    }
});

// --- 學生端專用 API ---
app.get('/api/student/assignments', authenticateToken, (req, res) => {
    if (req.user.type !== 'student') return res.status(403).json({ error: '僅學生可訪問' });
    res.json(db.prepare('SELECT * FROM assignments WHERE due_date IS NOT NULL AND due_date > CURRENT_TIMESTAMP ORDER BY due_date ASC').all());
});

app.post('/api/student/upload', authenticateToken, studentWorkUpload.single('file'), (req, res) => {
    if (req.user.type !== 'student') return res.status(403).json({ error: '僅學生可訪問' });
    if (!req.file) return res.status(400).json({ error: '沒有上傳檔案。' });
    res.json({ message: `檔案 ${req.file.filename} 已成功上傳！` });
});

// *** 新增：學生修改密碼 API ***
app.post('/api/student/change-password', authenticateToken, jsonParser, (req, res) => {
    if (req.user.type !== 'student') {
        return res.status(403).json({ error: '僅學生可操作。' });
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: '密碼格式不符，新密碼長度至少需要 6 個字元。' });
    }
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.user.id);
    if (!student || !bcrypt.compareSync(currentPassword, student.password)) {
        return res.status(401).json({ error: '目前的密碼不正確。' });
    }
    try {
        const newHashedPassword = bcrypt.hashSync(newPassword, 10);
        db.prepare('UPDATE students SET password = ? WHERE id = ?').run(newHashedPassword, req.user.id);
        res.json({ message: '密碼已成功更新！' });
    } catch (err) {
        res.status(500).json({ error: '資料庫錯誤，更新密碼失敗。' });
    }
});


// --- 其他 API (座位表, 儀表板) ---
app.get('/api/seating-chart', authenticateToken, (req, res) => {
    const chart = db.prepare("SELECT * FROM seating_charts WHERE name = 'default'").get();
    if (chart) {
        chart.seats = JSON.parse(chart.seats || '{}');
        res.json(chart);
    } else {
        res.json({ rows: 6, cols: 5, seats: {} });
    }
});

app.post('/api/seating-chart', authenticateToken, jsonParser, (req, res) => {
    const { rows, cols, seats } = req.body;
    const stmt = db.prepare(`INSERT INTO seating_charts (name, rows, cols, seats) VALUES ('default', ?, ?, ?) ON CONFLICT(name) DO UPDATE SET rows=excluded.rows, cols=excluded.cols, seats=excluded.seats`);
    stmt.run(rows, cols, JSON.stringify(seats));
    res.json({ message: '座位表已儲存。' });
});

app.get('/api/assignments', authenticateToken, (req, res) => {
    res.json(db.prepare('SELECT * FROM assignments ORDER BY created_at DESC').all());
});

app.post('/api/assignments', authenticateToken, jsonParser, (req, res) => {
    const { title, description, due_date } = req.body;
    if (!title) return res.status(400).json({ error: '作業標題為必填項。' });
    const info = db.prepare('INSERT INTO assignments (title, description, due_date) VALUES (?, ?, ?)').run(title, description, due_date);
    res.status(201).json(db.prepare('SELECT * FROM assignments WHERE id = ?').get(info.lastInsertRowid));
});

app.delete('/api/assignments/:id', authenticateToken, (req, res) => {
    const info = db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: '找不到指定的作業。' });
    res.json({ message: '作業已成功刪除。' });
});

app.get('/api/classroom-status', authenticateToken, (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: '必須提供日期參數' });
    try {
        const chart = db.prepare("SELECT * FROM seating_charts WHERE name = 'default'").get() || { seats: '{}' };
        chart.seats = JSON.parse(chart.seats);
        const attendance = db.prepare('SELECT student_id, status FROM attendance WHERE date = ?').all(date);
        const performance = db.prepare('SELECT student_id, SUM(points) as total_points FROM performance WHERE date = ? GROUP BY student_id').all(date);
        res.json({
            seatingChart: chart,
            attendance: Object.fromEntries(attendance.map(r => [r.student_id, r.status])),
            performance: Object.fromEntries(performance.map(r => [r.student_id, r.total_points]))
        });
    } catch (err) {
        res.status(500).json({ error: '讀取課堂狀態失敗。' });
    }
});

app.post('/api/attendance', authenticateToken, jsonParser, (req, res) => {
    const { student_id, date, status } = req.body;
    db.prepare(`INSERT INTO attendance (student_id, date, status, teacher_id) VALUES (?, ?, ?, ?) ON CONFLICT(student_id, date) DO UPDATE SET status = excluded.status`).run(student_id, date, status, req.user.id);
    res.status(200).json({ message: '出缺席紀錄已更新。' });
});

app.post('/api/performance', authenticateToken, jsonParser, (req, res) => {
    const { student_id, date, points, reason } = req.body;
    db.prepare('INSERT INTO performance (student_id, date, points, reason, teacher_id) VALUES (?, ?, ?, ?, ?)').run(student_id, date, points, reason, req.user.id);
    res.status(201).json({ message: '課堂表現已記錄。' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`後端伺服器正在 http://localhost:${PORT} 運行`);
});

