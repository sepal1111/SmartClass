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

// --- 修正：建立獨立的 JSON 解析器中介軟體 ---
const jsonParser = express.json();
const upload = multer({ storage: multer.memoryStorage() });


// --- 靜態檔案路徑設定 (支援封裝) ---
const isPkg = typeof process.pkg !== 'undefined';
const uploadsDirectory = isPkg
    ? path.join(path.dirname(process.execPath), 'uploads')
    : path.resolve(__dirname, 'uploads');

// 確保 uploads 資料夾存在
if (!fs.existsSync(uploadsDirectory)) {
    fs.mkdirSync(uploadsDirectory, { recursive: true });
}
// 讓前端可以透過 /uploads 路徑訪問此資料夾的檔案
app.use('/uploads', express.static(uploadsDirectory));


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

// --- 教師認證 API ---
app.get('/api/auth/teacher/setup-status', (req, res) => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM teachers');
    const result = stmt.get();
    res.json({ setupNeeded: result.count === 0 });
});

// 套用 jsonParser
app.post('/api/auth/teacher/register', jsonParser, (req, res) => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM teachers');
    const result = stmt.get();
    if (result.count > 0) {
        return res.status(403).json({ error: '系統已有管理員帳號。' });
    }

    const { name, username, password } = req.body;
    if (!name || !username || !password || password.length < 6) {
        return res.status(400).json({ error: '姓名、帳號或密碼格式不符。' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const insertStmt = db.prepare('INSERT INTO teachers (name, username, password) VALUES (?, ?, ?)');
    try {
        const info = insertStmt.run(name, username, hashedPassword);
        res.status(201).json({ message: '教師帳號建立成功！', userId: info.lastInsertRowid });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: '此帳號名稱已被使用。' });
        }
        res.status(500).json({ error: '資料庫錯誤，無法建立帳號。' });
    }
});

// 套用 jsonParser
app.post('/api/auth/teacher/login', jsonParser, (req, res) => {
    const { username, password } = req.body;
    const stmt = db.prepare('SELECT * FROM teachers WHERE username = ?');
    const user = stmt.get(username);

    if (user && bcrypt.compareSync(password, user.password)) {
        const { password, ...teacherInfo } = user; // 移除密碼
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '8h' });
        res.json({ token, teacher: teacherInfo });
    } else {
        res.status(401).json({ error: '帳號或密碼錯誤。' });
    }
});

// --- 學生管理 API ---
app.get('/api/students', authenticateToken, (req, res) => {
    const stmt = db.prepare('SELECT * FROM students');
    res.json(stmt.all());
});

// 套用 jsonParser
app.post('/api/students', authenticateToken, jsonParser, (req, res) => {
    const { student_id, name, class: className, seat_number, gender, account, password } = req.body;
    if (!student_id || !name || !account || !password) {
        return res.status(400).json({ error: '學號、姓名、帳號和密碼為必填項。' });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO students (student_id, name, class, seat_number, gender, account, password) VALUES (?, ?, ?, ?, ?, ?, ?)');
    try {
        const info = stmt.run(student_id, name, className, seat_number, gender, account, hashedPassword);
        const newStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(info.lastInsertRowid);
        res.status(201).json(newStudent);
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: '學號或帳號已存在。' });
        }
        res.status(500).json({ error: '資料庫錯誤。' });
    }
});

// 套用 jsonParser
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
        const updatedStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
        res.json(updatedStudent);
    } catch (err) {
         if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: '更新後的學號或帳號與現有學生重複。' });
        }
        res.status(500).json({ error: '資料庫錯誤。' });
    }
});

app.delete('/api/students/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM students WHERE id = ?');
    const info = stmt.run(id);
    if (info.changes === 0) return res.status(404).json({ error: '找不到指定的學生。' });
    res.json({ message: '學生已成功刪除。' });
});


// 檔案上傳路由：僅使用 multer，不使用 jsonParser
app.post('/api/students/import', authenticateToken, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '沒有上傳檔案。' });
    }

    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        const insertStmt = db.prepare('INSERT OR IGNORE INTO students (student_id, name, class, seat_number, gender, account, password) VALUES (?, ?, ?, ?, ?, ?, ?)');
        const defaultPassword = bcrypt.hashSync('password123', 10);
        let importedCount = 0;

        db.transaction((students) => {
            for (const student of students) {
                const info = insertStmt.run(
                    String(student['學號'] || ''),
                    String(student['姓名'] || ''),
                    String(student['班級'] || ''),
                    Number(student['座號'] || null),
                    String(student['性別'] || ''),
                    String(student['帳號'] || ''),
                    defaultPassword
                );
                 if (info.changes > 0) {
                    importedCount++;
                }
            }
        })(data);
        res.json({ message: `成功匯入 ${importedCount} 筆新學生資料。重複的資料會被忽略。` });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ error: '檔案處理失敗，請確認檔案內容與格式是否正確。' });
    }
});


// --- 其他 API (座位表, 作業, 儀表板) ---
app.get('/api/seating-chart', authenticateToken, (req, res) => {
    const stmt = db.prepare("SELECT * FROM seating_charts WHERE name = 'default'");
    const chart = stmt.get();
    if (chart) {
        try {
            chart.seats = JSON.parse(chart.seats);
        } catch (e) {
            chart.seats = {};
        }
        res.json(chart);
    } else {
        res.json({ rows: 6, cols: 5, seats: {} });
    }
});

// 套用 jsonParser
app.post('/api/seating-chart', authenticateToken, jsonParser, (req, res) => {
    const { rows, cols, seats } = req.body;
    const seatsJson = JSON.stringify(seats);
    const stmt = db.prepare(`
        INSERT INTO seating_charts (name, rows, cols, seats)
        VALUES ('default', ?, ?, ?)
        ON CONFLICT(name) DO UPDATE SET
        rows = excluded.rows,
        cols = excluded.cols,
        seats = excluded.seats
    `);
    try {
        stmt.run(rows, cols, seatsJson);
        res.json({ message: '座位表已儲存。' });
    } catch (err) {
        res.status(500).json({ error: '資料庫錯誤。' });
    }
});

app.get('/api/assignments', authenticateToken, (req, res) => {
    const stmt = db.prepare('SELECT * FROM assignments ORDER BY created_at DESC');
    res.json(stmt.all());
});

// 套用 jsonParser
app.post('/api/assignments', authenticateToken, jsonParser, (req, res) => {
    const { title, description, due_date } = req.body;
    if (!title) return res.status(400).json({ error: '作業標題為必填項。' });
    const stmt = db.prepare('INSERT INTO assignments (title, description, due_date) VALUES (?, ?, ?)');
    try {
        const info = stmt.run(title, description, due_date);
        const newAssignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(info.lastInsertRowid);
        res.status(201).json(newAssignment);
    } catch (err) {
        res.status(500).json({ error: '資料庫錯誤。' });
    }
});

app.delete('/api/assignments/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM assignments WHERE id = ?');
    const info = stmt.run(id);
    if (info.changes === 0) return res.status(404).json({ error: '找不到指定的作業。' });
    res.json({ message: '作業已成功刪除。' });
});

app.get('/api/classroom-status', authenticateToken, (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: '必須提供日期參數' });
    try {
        const chartStmt = db.prepare("SELECT * FROM seating_charts WHERE name = 'default'");
        const chart = chartStmt.get() || { rows: 6, cols: 5, seats: '{}' };
        chart.seats = JSON.parse(chart.seats);

        const attendanceStmt = db.prepare('SELECT student_id, status FROM attendance WHERE date = ?');
        const attendanceRecords = attendanceStmt.all(date);
        const attendanceMap = new Map(attendanceRecords.map(r => [r.student_id, r.status]));

        const performanceStmt = db.prepare('SELECT student_id, SUM(points) as total_points FROM performance WHERE date = ? GROUP BY student_id');
        const performanceRecords = performanceStmt.all(date);
        const performanceMap = new Map(performanceRecords.map(r => [r.student_id, r.total_points]));
        res.json({
            seatingChart: chart,
            attendance: Object.fromEntries(attendanceMap),
            performance: Object.fromEntries(performanceMap)
        });
    } catch (err) {
        console.error('Error fetching classroom status:', err);
        res.status(500).json({ error: '讀取課堂狀態失敗。' });
    }
});

// 套用 jsonParser
app.post('/api/attendance', authenticateToken, jsonParser, (req, res) => {
    const { student_id, date, status } = req.body;
    const teacher_id = req.user.id;
    if (!student_id || !date || !status) return res.status(400).json({ error: '缺少必要參數。' });
    try {
        const stmt = db.prepare(`
            INSERT INTO attendance (student_id, date, status, teacher_id)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(student_id, date) DO UPDATE SET status = excluded.status
        `);
        stmt.run(student_id, date, status, teacher_id);
        res.status(200).json({ message: '出缺席紀錄已更新。' });
    } catch (err) {
        console.error('Error updating attendance:', err);
        res.status(500).json({ error: '更新出缺席紀錄失敗。' });
    }
});

// 套用 jsonParser
app.post('/api/performance', authenticateToken, jsonParser, (req, res) => {
    const { student_id, date, points, reason } = req.body;
    const teacher_id = req.user.id;
    if (!student_id || !date || !points) return res.status(400).json({ error: '缺少必要參數。' });
    try {
        const stmt = db.prepare('INSERT INTO performance (student_id, date, points, reason, teacher_id) VALUES (?, ?, ?, ?, ?)');
        stmt.run(student_id, date, points, reason, teacher_id);
        res.status(201).json({ message: '課堂表現已記錄。' });
    } catch (err) {
        console.error('Error adding performance:', err);
        res.status(500).json({ error: '記錄課堂表現失敗。' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`後端伺服器正在 http://localhost:${PORT} 運行`);
});

