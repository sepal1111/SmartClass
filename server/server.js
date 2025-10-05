// File Path: /server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const bcrypt = require('bcrypt');
const initializeDatabase = require('./database');

const app = express();
const port = 3000;
const db = initializeDatabase();
const saltRounds = 10;

// --- Helper Function ---
// 將字串中的全形數字轉換為半形
function normalizeNumberString(input) {
  if (typeof input !== 'string' && typeof input !== 'number') return input;
  const str = String(input);
  return str.replace(/[０-９]/g, char => 
    String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
  ).trim();
}

// --- Middleware & Static Folders ---
const tempUploadsDir = path.join(__dirname, 'temp_uploads');
if (!fs.existsSync(tempUploadsDir)) fs.mkdirSync(tempUploadsDir);

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// --- API Routes ---

// --- 學生管理 API ---
app.get('/api/students', (req, res) => {
    try {
        const stmt = db.prepare('SELECT id, student_id, name, class, seat_number, gender, account FROM students ORDER BY student_id ASC');
        res.json(stmt.all());
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/students', (req, res) => {
    let { student_id, name, class: studentClass, seat_number, gender, account, password } = req.body;
    if (!student_id || !name || !account || !password) return res.status(400).json({ error: '學號、姓名、帳號和密碼為必填欄位' });
    
    const studentIdNum = parseInt(normalizeNumberString(student_id), 10);
    const seatNumberNum = seat_number ? parseInt(normalizeNumberString(seat_number), 10) : null;

    if (isNaN(studentIdNum)) {
        return res.status(400).json({ error: '學號必須是有效的數值' });
    }

    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) return res.status(500).json({ error: '密碼加密失敗' });
        try {
            const info = db.prepare('INSERT INTO students (student_id, name, class, seat_number, gender, account, password) VALUES (?, ?, ?, ?, ?, ?, ?)')
                         .run(studentIdNum, name, studentClass, seatNumberNum, gender, account, hash);
            res.status(201).json({ id: info.lastInsertRowid, ...req.body });
        } catch (e) {
            if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                if (e.message.includes('student_id')) return res.status(409).json({ error: `學號 ${student_id} 已存在` });
                if (e.message.includes('account')) return res.status(409).json({ error: `帳號 ${account} 已存在` });
            }
            res.status(500).json({ error: e.message });
        }
    });
});
app.put('/api/students/:id', (req, res) => {
    let { student_id, name, class: studentClass, seat_number, gender, account, password } = req.body;
    if (!student_id || !name || !account) return res.status(400).json({ error: '學號、姓名和帳號為必填欄位' });

    const studentIdNum = parseInt(normalizeNumberString(student_id), 10);
    const seatNumberNum = seat_number ? parseInt(normalizeNumberString(seat_number), 10) : null;
    
    if (isNaN(studentIdNum)) {
        return res.status(400).json({ error: '學號必須是有效的數值' });
    }

    const runUpdate = (hash) => {
        try {
            let sql = 'UPDATE students SET student_id = ?, name = ?, class = ?, seat_number = ?, gender = ?, account = ?';
            const params = [studentIdNum, name, studentClass, seatNumberNum, gender, account];
            if (hash) {
                sql += ', password = ?';
                params.push(hash);
            }
            sql += ' WHERE id = ?';
            params.push(req.params.id);

            const info = db.prepare(sql).run(...params);
            if (info.changes === 0) return res.status(404).json({ error: '找不到指定的學生' });
            res.json({ id: req.params.id, ...req.body });
        } catch (e) {
            if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                 if (e.message.includes('student_id')) return res.status(409).json({ error: `學號 ${student_id} 已存在` });
                 if (e.message.includes('account')) return res.status(409).json({ error: `帳號 ${account} 已存在` });
            }
            res.status(500).json({ error: e.message });
        }
    };

    if (password) {
        bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) return res.status(500).json({ error: '密碼加密失敗' });
            runUpdate(hash);
        });
    } else {
        runUpdate(null);
    }
});
app.delete('/api/students/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM students WHERE id = ?');
        const info = stmt.run(req.params.id);
        if (info.changes === 0) {
            return res.status(404).json({ error: '找不到指定的學生' });
        }
        res.status(200).json({ message: '學生已成功刪除' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const upload = multer({ dest: tempUploadsDir });
app.post('/api/students/import', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('沒有上傳檔案');
    try {
        const workbook = xlsx.readFile(req.file.path);
        const studentsData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        
        const insert = db.prepare('INSERT INTO students (student_id, name, class, seat_number, gender, account, password) VALUES (@student_id, @name, @class, @seat_number, @gender, @account, @password)');
        
        let importedCount = 0;
        let ignoredCount = 0;

        const insertMany = db.transaction((students) => {
            for (const s of students) {
                const student_id_raw = s['學號'] || s.student_id;
                const seat_number_raw = s['座號'] || s.seat_number;
                const name = s['姓名'] || s.name;
                const studentClass = s['班級'] || s.class;
                const gender = s['性別'] || s.gender;
                const account = s['帳號'] || s.account;
                const password = s['密碼'] || s.password;

                const student_id = parseInt(normalizeNumberString(student_id_raw), 10);
                const seat_number = seat_number_raw ? parseInt(normalizeNumberString(seat_number_raw), 10) : null;

                if (isNaN(student_id) || !name || !account || !password) {
                    ignoredCount++;
                    continue;
                }
                
                const hash = bcrypt.hashSync(String(password), saltRounds);
                
                try {
                    const result = insert.run({
                        student_id,
                        name,
                        class: studentClass,
                        seat_number,
                        gender,
                        account,
                        password: hash
                    });
                    if (result.changes > 0) importedCount++;
                    else ignoredCount++;
                } catch (e) {
                     ignoredCount++;
                }
            }
        });

        insertMany(studentsData);
        fs.unlinkSync(req.file.path);
        res.status(200).json({ message: `成功匯入 ${importedCount} 筆新資料，忽略 ${ignoredCount} 筆格式不符或重複的資料。` });

    } catch (e) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: `處理檔案時發生錯誤: ${e.message}` });
    }
});

app.get('/api/students/template', (req, res) => {
    const templatePath = path.join(__dirname, 'templates', 'template.xlsx');
    if (fs.existsSync(templatePath)) {
        res.sendFile(templatePath);
    } else {
        res.status(404).send('範本檔案不存在');
    }
});

// --- 座位表 API ---
app.get('/api/seating-chart', (req, res) => {
    try {
        const row = db.prepare("SELECT value FROM settings WHERE key = 'seating_chart'").get();
        if (row) {
            res.json(JSON.parse(row.value));
        } else {
            const defaultLayout = { rows: 5, cols: 6, grid: Array(30).fill(null) };
            res.json(defaultLayout);
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/seating-chart', (req, res) => {
    try {
        const stmt = db.prepare("INSERT INTO settings (key, value) VALUES ('seating_chart', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
        stmt.run(JSON.stringify(req.body));
        res.json({ message: '座位表已儲存' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- 出缺席 API ---
app.get('/api/attendance', (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: '必須提供日期' });
    try {
        const allStudents = db.prepare('SELECT id, name FROM students').all();
        const records = db.prepare('SELECT student_id, status FROM attendance_records WHERE record_date = ?').all(date);
        const attendanceMap = new Map(records.map(r => [r.student_id, r.status]));
        const fullList = allStudents.map(s => ({ student_id: s.id, name: s.name, status: attendanceMap.get(s.id) || '出席' }));
        res.json(fullList);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/attendance', (req, res) => {
    const { date, records } = req.body;
    if (!date || !Array.isArray(records)) return res.status(400).json({ error: '請求的資料格式不正確' });
    const upsert = db.prepare("INSERT INTO attendance_records (student_id, record_date, status) VALUES (?, ?, ?) ON CONFLICT(student_id, record_date) DO UPDATE SET status = excluded.status");
    const upsertMany = db.transaction(recs => { for (const r of recs) upsert.run(r.student_id, date, r.status); });
    try {
        upsertMany(records);
        res.json({ message: '出缺席紀錄已成功儲存！' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- 課堂表現 API ---
app.get('/api/performance', (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: '必須提供日期' });
    try {
        const records = db.prepare('SELECT student_id, SUM(points) as total_score FROM performance_records WHERE record_date = ? GROUP BY student_id').all(date);
        res.json(records);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/performance', (req, res) => {
    const { student_id, date, points } = req.body;
    if (!student_id || !date || typeof points !== 'number') return res.status(400).json({ error: '請求的資料格式不正確' });
    try {
        db.prepare('INSERT INTO performance_records (student_id, record_date, points, notes) VALUES (?, ?, ?, ?)').run(student_id, date, points, req.body.notes || null);
        res.status(201).json({ message: '表現紀錄已成功新增！' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- 作業管理 API ---
app.get('/api/assignments', (req, res) => {
    try {
        res.json(db.prepare('SELECT * FROM assignments ORDER BY created_at DESC').all());
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/assignments', (req, res) => {
    const { title, description, due_date } = req.body;
    if (!title) return res.status(400).json({ error: '作業標題為必填欄位' });
    const folderName = `${Date.now()}-${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
    const folderPath = path.join(uploadsDir, folderName);
    try {
        fs.mkdirSync(folderPath, { recursive: true });
        const info = db.prepare('INSERT INTO assignments (title, description, created_at, due_date, folder_path) VALUES (?, ?, datetime("now", "localtime"), ?, ?)').run(title, description, due_date, folderPath);
        res.status(201).json(db.prepare('SELECT * FROM assignments WHERE id = ?').get(info.lastInsertRowid));
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/assignments/:id', (req, res) => {
    try {
        const assignment = db.prepare('SELECT folder_path FROM assignments WHERE id = ?').get(req.params.id);
        if (assignment) {
            if (fs.existsSync(assignment.folder_path)) {
                fs.rmSync(assignment.folder_path, { recursive: true, force: true });
            }
            db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
            res.status(200).json({ message: '作業已成功刪除' });
        } else {
            res.status(404).json({ error: '找不到指定的作業' });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Server Start ---
app.listen(port, () => {
  console.log(`後端伺服器正在 http://localhost:${port} 運行`);
});


