import { pool } from "./db.js";

export async function createOrUpdateCookie(cookieData) {
  const hash = cookieData.userId; // or hash of all cookie fields
  const [rows] = await pool.query(
    "SELECT id FROM users WHERE cookie_hash = ?",
    [hash]
  );

  let userId;
  if (rows.length === 0) {
    const [result] = await pool.query(
      "INSERT INTO users (cookie_hash, visitor_id, cf_header_ip, t, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [hash, cookieData.userId, cookieData.cfHeader, 0]
    );
    userId = result.insertId;
  } else {
    userId = rows[0].id;
    // Update the updated_at timestamp
    await pool.query("UPDATE users SET updated_at = NOW() WHERE id = ?", [userId]);
  }

  // Insert a child log
  await pool.query(
    "INSERT INTO user_logs (user_id, action, details, timestamp) VALUES (?, ?, ?, NOW())",
    [userId, "cookie_updated", JSON.stringify(cookieData)]
  );

  return userId;
}