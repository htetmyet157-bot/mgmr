// backend/db.js
import mysql from "mysql2/promise";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Check if .env loaded
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME || !process.env.DB_PASS) {
  console.warn(
    "[DB] Warning: Some .env variables are missing. Make sure DB_HOST, DB_USER, DB_PASS, DB_NAME are set."
  );
}

// Create a connection pool
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
});

// Test connection (optional)
export const testDB = async () => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS now");
    console.log("[DB] Connection successful:", rows[0].now);
  } catch (err) {
    console.error("[DB] Connection failed:", err);
  }
};