// File Path: /server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const initializeDatabase = require('./database');

const app = express();
const port = 3000;
const db = initializeDatabase();
const saltRounds = 10;
const JWT_SECRET = 'your-super-secret-key-for-jwt'; // 在生產環境中應使用更複雜的密鑰

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

// --- 學生認證 API ---

// 學生登入
app.post('/api/auth/login', (req, res) => {
    const { account, password } = req.body;
    if (!account || !password) {
        return res.status(400).json({ error: '帳號和密碼為必填' });
    }
    try {
        const stmt = db.prepare('SELECT * FROM students WHERE account = ?');
        const student = stmt.get(account);

        if (!student) {
            return res.status(401).json({ error: '帳號或密碼錯誤' });
        }

        bcrypt.compare(password, student.password, (err, result) => {
            if (result) {
                const payload = { id: student.id, name: student.name, student_id: student.student_id };
                const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
                res.json({ message: '登入成功', token, student: payload });
            } else {
                res.status(401).json({ error: '帳號或密碼錯誤' });
            }
        });
    } catch (e) {
        res.status(500).json({ error: '伺服器內部錯誤' });
    }
});

// JWT 驗證中介軟體
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};


// --- 學生入口 API (需認證) ---

// 學生讀取作業列表
app.get('/api/student/assignments', authenticateToken, (req, res) => {
    try {
        const stmt = db.prepare('SELECT id, title, description, due_date FROM assignments WHERE due_date >= date(\'now\') ORDER BY due_date ASC');
        const assignments = stmt.all();
        res.json(assignments);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 設定學生作業上傳
const studentUploadStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const assignmentId = req.body.assignmentId;
        const stmt = db.prepare('SELECT folder_path FROM assignments WHERE id = ?');
        const assignment = stmt.get(assignmentId);
        if (assignment && assignment.folder_path) {
            const destPath = path.join(__dirname, '..', assignment.folder_path);
            cb(null, destPath);
        } else {
            cb(new Error('找不到指定的作業資料夾'), null);
        }
    },
    filename: function (req, file, cb) {
        const student = req.user;
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const fileName = `${student.student_id}_${student.name}_${originalName}`;
        cb(null, fileName);
    }
});
const studentUpload = multer({ storage: studentUploadStorage });

// 學生上傳作業
app.post('/api/student/upload', authenticateToken, studentUpload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '沒有上傳檔案' });
    }
    res.status(200).json({ message: `檔案 ${req.file.filename} 已成功上傳！`});
});


// --- 教師端 API ---

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

// --- Seating Chart API ---
app.get('/api/seating-chart', (req, res) => {
    try {
        const stmt = db.prepare("SELECT value FROM settings WHERE key = 'seating_chart'");
        const result = stmt.get();
        if (result) {
            res.json(JSON.parse(result.value));
        } else {
            res.json({ rows: 6, cols: 5, seats: {} }); // Default value
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/seating-chart', (req, res) => {
    const { rows, cols, seats } = req.body;
    try {
        const stmt = db.prepare(`
            INSERT INTO settings (key, value)
            VALUES ('seating_chart', ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `);
        stmt.run(JSON.stringify({ rows, cols, seats }));
        res.json({ message: '座位表已成功儲存！' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Attendance API ---
app.get('/api/attendance', (req, res) => {
    const { date } = req.query;
    if (!date) {
        return res.status(400).json({ error: '必須提供日期' });
    }

    try {
        const stmt = db.prepare(`
            SELECT student_id, status 
            FROM attendance_records 
            WHERE record_date = ?
        `);
        const records = stmt.all(date);
        res.json(records);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/attendance', (req, res) => {
    const { date, records } = req.body;
    if (!date || !Array.isArray(records)) {
        return res.status(400).json({ error: '請求的資料格式不正確' });
    }

    const upsertStmt = db.prepare(`
        INSERT INTO attendance_records (student_id, record_date, status)
        VALUES (?, ?, ?)
        ON CONFLICT(student_id, record_date) DO UPDATE SET status = excluded.status
    `);

    const upsertTransaction = db.transaction((recordsToSave) => {
        for (const record of recordsToSave) {
            upsertStmt.run(record.student_id, date, record.status);
        }
    });

    try {
        upsertTransaction(records);
        res.json({ message: '出缺席紀錄已成功儲存！' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Performance API ---
app.get('/api/performance', (req, res) => {
    const { date } = req.query;
    if (!date) {
        return res.status(400).json({ error: '必須提供日期' });
    }
    try {
        const stmt = db.prepare(`
            SELECT student_id, SUM(points) as total_score
            FROM performance_records
            WHERE record_date = ?
            GROUP BY student_id
        `);
        const records = stmt.all(date);
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/performance', (req, res) => {
    const { student_id, date, points, notes } = req.body;
    if (!student_id || !date || typeof points !== 'number') {
        return res.status(400).json({ error: '請求的資料格式不正確' });
    }
    try {
        const stmt = db.prepare(`
            INSERT INTO performance_records (student_id, record_date, points, notes)
            VALUES (?, ?, ?, ?)
        `);
        stmt.run(student_id, date, points, notes || null);
        res.status(201).json({ message: '表現紀錄已成功新增！' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Assignment API ---
app.get('/api/assignments', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM assignments ORDER BY created_at DESC');
        const assignments = stmt.all();
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/assignments', (req, res) => {
    const { title, description, due_date } = req.body;
    if (!title) {
        return res.status(400).json({ error: '作業標題為必填欄位' });
    }

    const folderName = `${Date.now()}-${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
    const folderPath = path.join(uploadsDir, folderName);
    
    try {
        fs.mkdirSync(folderPath, { recursive: true });

        const stmt = db.prepare(`
            INSERT INTO assignments (title, description, created_at, due_date, folder_path)
            VALUES (?, ?, datetime('now', 'localtime'), ?, ?)
        `);
        const info = stmt.run(title, description, due_date, folderName);
        
        const newAssignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(info.lastInsertRowid);
        res.status(201).json(newAssignment);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/assignments/:id', (req, res) => {
    try {
        const stmtGet = db.prepare('SELECT folder_path FROM assignments WHERE id = ?');
        const assignment = stmtGet.get(req.params.id);

        if (assignment) {
            const fullPath = path.join(uploadsDir, assignment.folder_path);
            if (fs.existsSync(fullPath)) {
                fs.rmSync(fullPath, { recursive: true, force: true });
            }
            const stmtDelete = db.prepare('DELETE FROM assignments WHERE id = ?');
            stmtDelete.run(req.params.id);
            res.status(200).json({ message: '作業已成功刪除' });
        } else {
            res.status(404).json({ error: '找不到指定的作業' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Server Start ---
app.listen(port, () => {
  console.log(`後端伺服器正在 http://localhost:${port} 運行`);
});

