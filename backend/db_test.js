import { pool } from "./backend/db.js";

async function test() {
  try {
    const [rows] = await pool.query("SHOW TABLES");
    console.log("Tables in DB:", rows);
    process.exit(0);
  } catch (err) {
    console.error("DB Connection failed:", err);
    process.exit(1);
  }
}

test();