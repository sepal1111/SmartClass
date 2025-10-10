// File Path: /server/database.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// --- 修正路徑以支援封裝 ---
const isPkg = typeof process.pkg !== 'undefined';
const dataDirectory = isPkg 
    ? path.join(path.dirname(process.execPath), 'data') 
    : path.resolve(__dirname, 'data');

if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
}

const dbPath = path.join(dataDirectory, 'classroom.sqlite');
const db = new Database(dbPath);


// 初始化資料庫結構
const initDb = () => {
    // 教師表
    const createTeachersTable = `
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `;

    // 學生表
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

    // 座位表
    const createSeatingChartsTable = `
    CREATE TABLE IF NOT EXISTS seating_charts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE DEFAULT 'default',
      rows INTEGER NOT NULL,
      cols INTEGER NOT NULL,
      seats TEXT NOT NULL
    );
  `;

    // 作業表
    const createAssignmentsTable = `
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      due_date DATETIME,
      subject_id INTEGER,
      allow_resubmission INTEGER DEFAULT 1, -- 1 for true, 0 for false
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );
  `;

  // 出缺席表
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

  // 課堂表現表
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

  // --- 新增：成績管理相關資料表 ---
  // 科目表
  const createSubjectsTable = `
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      teacher_id INTEGER,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    );
  `;
  // 成績項目表
  const createGradeItemsTable = `
    CREATE TABLE IF NOT EXISTS grade_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL, -- '平時測驗', '定期評量'
      subject_id INTEGER NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      teacher_id INTEGER,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    );
  `;
  // 成績紀錄表
  const createGradesTable = `
    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grade_item_id INTEGER NOT NULL,
      student_id TEXT NOT NULL,
      score REAL, -- 使用 REAL 以支援小數點
      FOREIGN KEY (grade_item_id) REFERENCES grade_items(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
      UNIQUE(grade_item_id, student_id)
    );
  `;

    // --- 新增：遊戲式搶答競賽 (QuizRace) 相關資料表 ---
    // 測驗集
    const createQuizSetsTable = `
    CREATE TABLE IF NOT EXISTS quiz_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subject_id INTEGER,
      teacher_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
    );
    `;

    // *** 關鍵修正：在 quiz_questions 資料表中新增 correct_answer 欄位 ***
    const createQuizQuestionsTable = `
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_set_id INTEGER NOT NULL,
      question_text TEXT,
      options TEXT NOT NULL,
      correct_answer TEXT, -- 新增此欄位來儲存正確答案
      FOREIGN KEY (quiz_set_id) REFERENCES quiz_sets(id) ON DELETE CASCADE
    );
    `;

    db.exec(createTeachersTable);
    db.exec(createStudentsTable);
    db.exec(createSeatingChartsTable);
    db.exec(createAssignmentsTable);
    db.exec(createAttendanceTable);
    db.exec(createPerformanceTable);
    db.exec(createSubjectsTable);
    db.exec(createGradeItemsTable);
    db.exec(createGradesTable);
    db.exec(createQuizSetsTable);
    db.exec(createQuizQuestionsTable);

    // --- 新增：插入預設科目資料 ---
    const checkSubjects = db.prepare('SELECT COUNT(*) as count FROM subjects').get();
    if (checkSubjects.count === 0) {
        const insert = db.prepare('INSERT INTO subjects (name) VALUES (?)');
        const defaultSubjects = ['國語', '數學', '社會', '自然', '英文', '彈性'];
        const insertMany = db.transaction((subjects) => {
            for (const subject of subjects) insert.run(subject);
        });
        insertMany(defaultSubjects);
        console.log('預設科目已成功插入資料庫。');
    }
};

initDb();

module.exports = db;

