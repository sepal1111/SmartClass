// File Path: /server/database.js
const Database = require('better-sqlite3');
const path = require('path');

function initializeDatabase() {
  const dbPath = path.join(__dirname, '../', 'classroom.sqlite');
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      class TEXT,
      seat_number INTEGER,
      gender TEXT,
      account TEXT UNIQUE,
      password TEXT
    );
  `);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        record_date TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE(student_id, record_date)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS performance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        record_date TEXT NOT NULL,
        points INTEGER NOT NULL,
        notes TEXT,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
  `);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        due_date TEXT,
        folder_path TEXT NOT NULL UNIQUE
    );
  `);

  console.log('資料庫已成功初始化。');
  return db;
}

module.exports = initializeDatabase;

