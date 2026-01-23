import mysql from "mysql2/promise";
import path from "path";
import fs from "fs";

// Make sure .env exists
const envPath = path.resolve(process.cwd(), ".env");
if (!fs.existsSync(envPath)) {
  console.warn(".env file not found at project root:", envPath);
}

export const pool = mysql.createPool({
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "my_project_db",

  // ✅ IMPORTANT: use socket, not TCP
  socketPath: process.env.DB_SOCKET || "/run/mysqld/mysqld.sock",

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
});