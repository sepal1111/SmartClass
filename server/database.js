// File Path: /server/database.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// --- 修正路徑以支援封裝 ---
// 判斷是否在 pkg 封裝環境中
const isPkg = typeof process.pkg !== 'undefined';

// 如果在封裝環境，資料庫路徑設定在執行檔同層的 data 資料夾；否則使用開發時期的相對路徑
const dataDirectory = isPkg 
    ? path.join(path.dirname(process.execPath), 'data') 
    : path.resolve(__dirname, 'data');

// 確保資料夾存在
if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
}

const dbPath = path.join(dataDirectory, 'classroom.sqlite');
const db = new Database(dbPath);


// 初始化資料庫結構
const initDb = () => {
    // 增加 name 欄位
    const createTeachersTable = `
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `;

    const createStudentsTable = `
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      class TEXT,
      seat_number INTEGER,
      gender TEXT,
      account TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `;

    const createSeatingChartsTable = `
    CREATE TABLE IF NOT EXISTS seating_charts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE DEFAULT 'default',
      rows INTEGER NOT NULL,
      cols INTEGER NOT NULL,
      seats TEXT NOT NULL
    );
  `;

    const createAssignmentsTable = `
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      due_date DATETIME
    );
  `;

  const createAttendanceTable = `
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      date TEXT NOT NULL, -- 格式 'YYYY-MM-DD'
      status TEXT NOT NULL, -- 例如: 'present', 'sick', 'absent'
      teacher_id INTEGER,
      UNIQUE(student_id, date),
      FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    );
  `;

  const createPerformanceTable = `
    CREATE TABLE IF NOT EXISTS performance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        date TEXT NOT NULL, -- 格式 'YYYY-MM-DD'
        points INTEGER NOT NULL,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        teacher_id INTEGER,
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    );
  `;

    db.exec(createTeachersTable);
    db.exec(createStudentsTable);
    db.exec(createSeatingChartsTable);
    db.exec(createAssignmentsTable);
    db.exec(createAttendanceTable);
    db.exec(createPerformanceTable);
};

initDb();

module.exports = db;

