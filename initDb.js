// initDb.js
import { pool } from "./backend/db.js";

async function initDb() {
  try {
    console.log("[DB Init] Starting...");

    // 1️⃣ Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        cookie_hash VARCHAR(255) NOT NULL UNIQUE,
        visitor_id VARCHAR(255),
        cf_header_ip VARCHAR(45),
        t INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_submission_date DATE
      )
    `);

    // 2️⃣ User logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_logs (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED,
        action VARCHAR(255) NOT NULL,
        session_id VARCHAR(128),
        submission_id CHAR(36),
        status ENUM('pending','success','failed') DEFAULT 'pending',
        submission_date DATE,
        submission_time DATETIME,
        file_name TEXT,
        t INT,
        book_order_name VARCHAR(255),
        extra_info TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 3️⃣ Sessions table (for express-session MySQL store)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id VARCHAR(128) PRIMARY KEY,
        expires INT UNSIGNED NOT NULL,
        data TEXT
      )
    `);

    console.log("[DB Init] All tables ready!");
    process.exit(0);
  } catch (err) {
    console.error("[DB Init] Error:", err);
    process.exit(1);
  }
}

initDb();