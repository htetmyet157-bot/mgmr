import { pool } from "../backend/db.js";

export async function cookieDBCheck(req, res, next) {
  try {
    // 1️⃣ Grab the cookie
    const cookieData = req.cookies.userData;
    if (!cookieData) {
      console.warn("[cookieDBCheck] No cookie found");
      return res.status(403).json({ status: "rejected", reason: "No cookie" });
    }

    // 2️⃣ Parse the cookie safely
    let parsed;
    try {
      parsed = JSON.parse(cookieData);
    } catch (err) {
      console.warn("[cookieDBCheck] Invalid JSON in cookie:", cookieData);
      return res.status(403).json({ status: "rejected", reason: "Invalid cookie" });
    }

    // 3️⃣ Determine the lookup value
    // If you intend to store a hash, you can hash here: e.g., hash(parsed.userId)
    const cookieHash = parsed.userId;

    // 4️⃣ Query DB for user
    const [rows] = await pool.query(
      "SELECT id FROM users WHERE cookie_hash = ?",
      [cookieHash]
    );

    if (rows.length === 0) {
      console.warn("[cookieDBCheck] Unknown visitor:", cookieHash);
      return res.status(403).json({ status: "rejected", reason: "Unknown visitor" });
    }

    // 5️⃣ Attach info to req for downstream usage
    req.userId = rows[0].id;
    req.cookieData = parsed;

    // ✅ Continue to next middleware/route
    next();

  } catch (err) {
    console.error("[cookieDBCheck] Internal error:", err);
    res.status(500).json({ status: "error", reason: "Internal server error" });
  }
}