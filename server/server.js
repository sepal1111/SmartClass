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
const baseDir = isPkg ? path.dirname(process.execPath) : __dirname;
const uploadsDirectory = path.join(baseDir, 'uploads');
const photosDirectory = path.join(baseDir, 'photos');

[uploadsDirectory, photosDirectory].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use('/uploads', express.static(uploadsDirectory));
app.use('/photos', express.static(photosDirectory));

// --- Multer 設定 ---
const fileImportUpload = multer({ storage: multer.memoryStorage() });
const studentWorkUpload = multer({ 
    storage: multer.diskStorage({
        destination: uploadsDirectory,
        filename: (req, file, cb) => {
            const studentInfo = db.prepare('SELECT student_id, name FROM students WHERE id = ?').get(req.user.id);
            if (!studentInfo) return cb(new Error('找不到學生資料'), null);
            const originalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
            cb(null, `${studentInfo.student_id}_${studentInfo.name}_${originalName}`);
        }
    }) 
});
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

// --- API 路由 ---

// 認證
app.get('/api/auth/teacher/setup-status', (req, res) => res.json({ setupNeeded: db.prepare('SELECT COUNT(*) as count FROM teachers').get().count === 0 }));
app.post('/api/auth/teacher/register', jsonParser, (req, res) => {
    if (db.prepare('SELECT COUNT(*) as count FROM teachers').get().count > 0) return res.status(403).json({ error: '系統已有管理員帳號。' });
    const { name, username, password } = req.body;
    if (!name || !username || !password || password.length < 6) return res.status(400).json({ error: '姓名、帳號或密碼格式不符。' });
    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        db.prepare('INSERT INTO teachers (name, username, password) VALUES (?, ?, ?)').run(name, username, hashedPassword);
        res.status(201).json({ message: '教師帳號建立成功！' });
    } catch (err) { res.status(500).json({ error: '資料庫錯誤，無法建立帳號。' }); }
});
app.post('/api/auth/teacher/login', jsonParser, (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM teachers WHERE username = ?').get(username);
    if (user && bcrypt.compareSync(password, user.password)) {
        const { password, ...teacherInfo } = user;
        const token = jwt.sign({ id: user.id, username: user.username, type: 'teacher' }, SECRET_KEY, { expiresIn: '8h' });
        res.json({ token, teacher: teacherInfo });
    } else { res.status(401).json({ error: '帳號或密碼錯誤。' }); }
});
app.post('/api/auth/student/login', jsonParser, (req, res) => {
    const { account, password } = req.body;
    const user = db.prepare('SELECT * FROM students WHERE account = ?').get(account);
    if (user && bcrypt.compareSync(password, user.password)) {
        const { password, ...studentInfo } = user;
        const token = jwt.sign({ id: user.id, account: user.account, type: 'student' }, SECRET_KEY, { expiresIn: '8h' });
        res.json({ token, student: studentInfo });
    } else { res.status(401).json({ error: '帳號或密碼錯誤。' }); }
});

// 學生管理
app.get('/api/students', authenticateToken, (req, res) => res.json(db.prepare('SELECT * FROM students').all()));
app.post('/api/students', authenticateToken, jsonParser, (req, res) => { const { student_id, name, class: className, seat_number, gender, account, password } = req.body; if (!student_id || !name || !account || !password) return res.status(400).json({ error: '學號、姓名、帳號和密碼為必填項。' }); const hashedPassword = bcrypt.hashSync(password, 10); try { const info = db.prepare('INSERT INTO students (student_id, name, class, seat_number, gender, account, password) VALUES (?, ?, ?, ?, ?, ?, ?)').run(student_id, name, className, seat_number, gender, account, hashedPassword); res.status(201).json(db.prepare('SELECT * FROM students WHERE id = ?').get(info.lastInsertRowid)); } catch (err) { res.status(500).json({ error: '資料庫錯誤。' }); } });
app.put('/api/students/:id', authenticateToken, jsonParser, (req, res) => { const { id } = req.params; const { student_id, name, class: className, seat_number, gender, account, password } = req.body; let setClauses = "student_id = ?, name = ?, class = ?, seat_number = ?, gender = ?, account = ?"; let params = [student_id, name, className, seat_number, gender, account]; if (password) { setClauses += ", password = ?"; params.push(bcrypt.hashSync(password, 10)); } params.push(id); try { const info = db.prepare(`UPDATE students SET ${setClauses} WHERE id = ?`).run(...params); if (info.changes === 0) return res.status(404).json({ error: '找不到指定的學生。' }); res.json(db.prepare('SELECT * FROM students WHERE id = ?').get(id)); } catch (err) { res.status(500).json({ error: '資料庫錯誤。' }); } });
app.delete('/api/students/:id', authenticateToken, (req, res) => { const info = db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id); if (info.changes === 0) return res.status(404).json({ error: '找不到指定的學生。' }); res.json({ message: '學生已成功刪除。' }); });
app.post('/api/students/import', authenticateToken, fileImportUpload.single('file'), (req, res) => { if (!req.file) return res.status(400).json({ error: '沒有上傳檔案。' }); try { const workbook = xlsx.read(req.file.buffer, { type: 'buffer' }); const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]); const insertStmt = db.prepare('INSERT OR IGNORE INTO students (student_id, name, class, seat_number, gender, account, password) VALUES (?, ?, ?, ?, ?, ?, ?)'); let importedCount = 0; db.transaction((students) => { for (const student of students) { const hashedPassword = bcrypt.hashSync(String(student['密碼'] || 'password123'), 10); const info = insertStmt.run(String(student['學號']||''), String(student['姓名']||''), String(student['班級']||''), Number(student['座號']||null), String(student['性別']||''), String(student['帳號']||''), hashedPassword); if (info.changes > 0) importedCount++; } })(data); res.json({ message: `成功匯入 ${importedCount} 筆新學生資料。重複的資料會被忽略。` }); } catch (error) { res.status(500).json({ error: '檔案處理失敗，請確認格式。' }); } });
app.post('/api/students/photos/upload', authenticateToken, photoUpload.array('photos'), (req, res) => { if (!req.files || req.files.length === 0) return res.status(400).json({ error: '沒有上傳任何照片檔案。' }); try { const studentIdSet = new Set(db.prepare('SELECT student_id FROM students').all().map(s => s.student_id)); let successCount = 0; const failedFiles = []; req.files.forEach(file => { const originalFileExtension = path.extname(file.originalname); const studentId = path.basename(file.originalname, originalFileExtension); const lowerCaseExtension = originalFileExtension.toLowerCase(); if (studentIdSet.has(studentId) && ['.jpg', '.jpeg', '.png'].includes(lowerCaseExtension)) { ['.jpg', '.jpeg', '.png'].forEach(ext => { const oldPath = path.join(photosDirectory, studentId + ext); if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); }); const newFilename = studentId + lowerCaseExtension; fs.writeFileSync(path.join(photosDirectory, newFilename), file.buffer); successCount++; } else { failedFiles.push(file.originalname); } }); let message = `成功上傳 ${successCount} 張照片。`; if (failedFiles.length > 0) message += ` ${failedFiles.length} 個檔案無法對應學號或格式不符：${failedFiles.join(', ')}`; res.json({ message }); } catch (error) { res.status(500).json({ error: '處理照片上傳時發生伺服器錯誤。' }); } });
app.get('/api/students/photos', authenticateToken, (req, res) => { try { res.json(fs.readdirSync(photosDirectory)); } catch (error) { res.status(500).json({ error: '無法讀取照片列表。' }); } });

// 學生端
app.get('/api/student/assignments', authenticateToken, (req, res) => { if (req.user.type !== 'student') return res.status(403).json({ error: '僅學生可訪問' }); res.json(db.prepare('SELECT * FROM assignments WHERE due_date IS NOT NULL AND due_date > CURRENT_TIMESTAMP ORDER BY due_date ASC').all()); });
app.post('/api/student/upload', authenticateToken, studentWorkUpload.single('file'), (req, res) => { if (req.user.type !== 'student') return res.status(403).json({ error: '僅學生可訪問' }); if (!req.file) return res.status(400).json({ error: '沒有上傳檔案。' }); res.json({ message: `檔案 ${req.file.filename} 已成功上傳！` }); });
app.post('/api/student/change-password', authenticateToken, jsonParser, (req, res) => { if (req.user.type !== 'student') return res.status(403).json({ error: '僅學生可操作。' }); const { currentPassword, newPassword } = req.body; if (!currentPassword || !newPassword || newPassword.length < 6) return res.status(400).json({ error: '密碼格式不符，新密碼長度至少需要 6 個字元。' }); const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.user.id); if (!student || !bcrypt.compareSync(currentPassword, student.password)) return res.status(401).json({ error: '目前的密碼不正確。' }); try { db.prepare('UPDATE students SET password = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.user.id); res.json({ message: '密碼已成功更新！' }); } catch (err) { res.status(500).json({ error: '資料庫錯誤，更新密碼失敗。' }); } });

// 成績管理
app.get('/api/subjects', authenticateToken, (req, res) => res.json(db.prepare('SELECT * FROM subjects ORDER BY id ASC').all()));
app.post('/api/subjects', authenticateToken, jsonParser, (req, res) => { const { name } = req.body; if (!name) return res.status(400).json({ error: '科目名稱為必填項。' }); try { const info = db.prepare('INSERT INTO subjects (name, teacher_id) VALUES (?, ?)').run(name, req.user.id); res.status(201).json(db.prepare('SELECT * FROM subjects WHERE id = ?').get(info.lastInsertRowid)); } catch (err) { res.status(500).json({ error: '資料庫錯誤。' }); } });
app.put('/api/subjects/:id', authenticateToken, jsonParser, (req, res) => { const { name } = req.body; if (!name) return res.status(400).json({ error: '科目名稱為必填項。' }); try { const info = db.prepare('UPDATE subjects SET name = ? WHERE id = ?').run(name, req.params.id); if (info.changes === 0) return res.status(404).json({ error: '找不到指定的科目。' }); res.json(db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id)); } catch (err) { res.status(500).json({ error: '資料庫錯誤。' }); } });
app.delete('/api/subjects/:id', authenticateToken, (req, res) => { const info = db.prepare('DELETE FROM subjects WHERE id = ?').run(req.params.id); if (info.changes === 0) return res.status(404).json({ error: '找不到指定的科目。' }); res.json({ message: '科目已成功刪除。' }); });
app.get('/api/grade-items', authenticateToken, (req, res) => res.json(db.prepare(`SELECT gi.id, gi.name, gi.category, gi.subject_id, gi.date, s.name as subject_name FROM grade_items gi JOIN subjects s ON gi.subject_id = s.id ORDER BY gi.date DESC`).all()));
app.post('/api/grade-items', authenticateToken, jsonParser, (req, res) => { const { name, category, subject_id } = req.body; if (!name || !category || !subject_id) return res.status(400).json({ error: '缺少必要參數。' }); const info = db.prepare('INSERT INTO grade_items (name, category, subject_id, teacher_id) VALUES (?, ?, ?, ?)').run(name, category, subject_id, req.user.id); res.status(201).json(db.prepare(`SELECT gi.id, gi.name, gi.category, gi.subject_id, gi.date, s.name as subject_name FROM grade_items gi JOIN subjects s ON gi.subject_id = s.id WHERE gi.id = ?`).get(info.lastInsertRowid)); });
app.delete('/api/grade-items/:id', authenticateToken, (req, res) => { const info = db.prepare('DELETE FROM grade_items WHERE id = ?').run(req.params.id); if (info.changes === 0) return res.status(404).json({ error: '找不到指定的成績項目。' }); res.json({ message: '成績項目已成功刪除。' }); });
app.get('/api/grades/:grade_item_id', authenticateToken, (req, res) => { const students = db.prepare('SELECT id, student_id, name, seat_number FROM students ORDER BY seat_number ASC, student_id ASC').all(); const grades = db.prepare('SELECT student_id, score FROM grades WHERE grade_item_id = ?').all(req.params.grade_item_id); const gradeMap = new Map(grades.map(g => [g.student_id, g.score])); res.json(students.map(s => ({ ...s, score: gradeMap.get(s.student_id) ?? null }))); });
app.post('/api/grades', authenticateToken, jsonParser, (req, res) => { const { grade_item_id, student_id, score } = req.body; if (!grade_item_id || !student_id) return res.status(400).json({ error: '缺少必要參數。' }); db.prepare(`INSERT INTO grades (grade_item_id, student_id, score) VALUES (?, ?, ?) ON CONFLICT(grade_item_id, student_id) DO UPDATE SET score = excluded.score`).run(grade_item_id, student_id, score === '' || score === null ? null : Number(score)); res.status(200).json({ message: '成績已更新' }); });
app.get('/api/performance-summary', authenticateToken, (req, res) => res.json(db.prepare(`SELECT s.id, s.student_id, s.name, s.seat_number, SUM(COALESCE(p.points, 0)) as total_score FROM students s LEFT JOIN performance p ON s.student_id = p.student_id GROUP BY s.id, s.student_id, s.name, s.seat_number ORDER BY s.seat_number ASC, s.student_id ASC`).all()));
app.get('/api/attendance-summary', authenticateToken, (req, res) => { const { startDate, endDate } = req.query; if (!startDate || !endDate) return res.status(400).json({ error: '必須提供開始與結束日期。' }); try { res.json(db.prepare(` SELECT s.student_id, s.name, s.seat_number, SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present, SUM(CASE WHEN a.status = 'sick' THEN 1 ELSE 0 END) as sick, SUM(CASE WHEN a.status = 'official' THEN 1 ELSE 0 END) as official, SUM(CASE WHEN a.status = 'personal' THEN 1 ELSE 0 END) as personal, SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent FROM students s LEFT JOIN attendance a ON s.student_id = a.student_id AND a.date BETWEEN ? AND ? GROUP BY s.student_id, s.name, s.seat_number ORDER BY s.seat_number ASC, s.student_id ASC `).all(startDate, endDate)); } catch (err) { res.status(500).json({ error: '讀取學期出缺席統計失敗。' }); } });

// 座位表 & 儀表板
app.get('/api/seating-chart', authenticateToken, (req, res) => { const chart = db.prepare("SELECT * FROM seating_charts WHERE name = 'default'").get(); res.json(chart ? { ...chart, seats: JSON.parse(chart.seats || '{}') } : { rows: 6, cols: 5, seats: {} }); });
app.post('/api/seating-chart', authenticateToken, jsonParser, (req, res) => { const { rows, cols, seats } = req.body; db.prepare(`INSERT INTO seating_charts (name, rows, cols, seats) VALUES ('default', ?, ?, ?) ON CONFLICT(name) DO UPDATE SET rows=excluded.rows, cols=excluded.cols, seats=excluded.seats`).run(rows, cols, JSON.stringify(seats)); res.json({ message: '座位表已儲存。' }); });
app.get('/api/assignments', authenticateToken, (req, res) => res.json(db.prepare('SELECT * FROM assignments ORDER BY created_at DESC').all()));
app.post('/api/assignments', authenticateToken, jsonParser, (req, res) => { const { title, description, due_date } = req.body; if (!title) return res.status(400).json({ error: '作業標題為必填項。' }); const info = db.prepare('INSERT INTO assignments (title, description, due_date) VALUES (?, ?, ?)').run(title, description, due_date); res.status(201).json(db.prepare('SELECT * FROM assignments WHERE id = ?').get(info.lastInsertRowid)); });
app.delete('/api/assignments/:id', authenticateToken, (req, res) => { const info = db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id); if (info.changes === 0) return res.status(404).json({ error: '找不到指定的作業。' }); res.json({ message: '作業已成功刪除。' }); });
app.get('/api/classroom-status', authenticateToken, (req, res) => { const { date } = req.query; if (!date) return res.status(400).json({ error: '必須提供日期參數' }); try { const chart = db.prepare("SELECT * FROM seating_charts WHERE name = 'default'").get() || { seats: '{}' }; chart.seats = JSON.parse(chart.seats); const studentsOnChart = Object.values(chart.seats).filter(s => s && s.student_id).map(s => s.student_id); if (studentsOnChart.length > 0) { const existingRecords = db.prepare(`SELECT student_id FROM attendance WHERE date = ? AND student_id IN (${studentsOnChart.map(() => '?').join(',')})`).all(date, ...studentsOnChart).map(r => r.student_id); const studentsToInsert = studentsOnChart.filter(id => !existingRecords.includes(id)); if (studentsToInsert.length > 0) { const insertMany = db.transaction((students) => { for (const studentId of students) db.prepare('INSERT INTO attendance (student_id, date, status, teacher_id) VALUES (?, ?, ?, ?)').run(studentId, date, 'present', req.user.id); }); insertMany(studentsToInsert); } } const attendance = db.prepare('SELECT student_id, status FROM attendance WHERE date = ?').all(date); const performance = db.prepare('SELECT student_id, SUM(points) as total_points FROM performance WHERE date = ? GROUP BY student_id').all(date); res.json({ seatingChart: chart, attendance: Object.fromEntries(attendance.map(r => [r.student_id, r.status])), performance: Object.fromEntries(performance.map(r => [r.student_id, r.total_points])) }); } catch (err) { res.status(500).json({ error: '讀取課堂狀態失敗。' }); } });
app.post('/api/attendance', authenticateToken, jsonParser, (req, res) => { const { student_id, date, status } = req.body; db.prepare(`INSERT INTO attendance (student_id, date, status, teacher_id) VALUES (?, ?, ?, ?) ON CONFLICT(student_id, date) DO UPDATE SET status = excluded.status`).run(student_id, date, status, req.user.id); res.status(200).json({ message: '出缺席紀錄已更新。' }); });
app.post('/api/performance', authenticateToken, jsonParser, (req, res) => { const { student_id, date, points, reason } = req.body; db.prepare('INSERT INTO performance (student_id, date, points, reason, teacher_id) VALUES (?, ?, ?, ?, ?)').run(student_id, date, points, reason, req.user.id); res.status(201).json({ message: '課堂表現已記錄。' }); });

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`後端伺服器正在 http://localhost:${PORT} 運行`);
});

