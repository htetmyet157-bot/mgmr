// backend/api-routes/check.js
import express from "express";
import fs from "fs-extra";
import path from "path";
import { pool } from "../backend/db.js";
import { randomUUID } from "crypto";

const router = express.Router();

const textDir = path.join(process.cwd(), "saved_texts");
fs.ensureDirSync(textDir);

const sessionLogFile = path.join(process.cwd(), "logs", "session.log");
fs.ensureFileSync(sessionLogFile);

// POST /check
router.post("/", async (req, res) => {
  try {
    const { textContent } = req.body;
    if (!textContent) {
      return res.status(400).json({ error: "No text provided" });
    }

    /* =========================
       1️⃣ Verify visitor cookie
       ========================= */
    const cookieData = req.cookies.userData;
    if (!cookieData) {
      return res.status(403).json({ error: "Unauthorized: no cookie" });
    }

    let cookieObj;
    try {
      cookieObj = JSON.parse(cookieData);
    } catch {
      return res.status(400).json({ error: "Invalid cookie" });
    }

    const visitorHash = cookieObj.userId;
    const bookOrderName = cookieObj.book_order_name || null;

    /* =========================
       2️⃣ Load user
       ========================= */
    const [users] = await pool.query(
      "SELECT id, t, last_submission_date FROM users WHERE cookie_hash = ?",
      [visitorHash]
    );

    if (users.length === 0) {
      return res.status(403).json({ error: "Unauthorized user" });
    }

    const user = users[0];
    const userId = user.id;

    /* =========================
       3️⃣ Prepare identifiers
       ========================= */
    const submissionId = randomUUID(); // 🔑 CORE ID
    const sessionId = req.session.id;

    const timestamp = new Date();
    const today = timestamp.toISOString().split("T")[0];

    /* =========================
       4️⃣ Save file
       ========================= */
    const formattedText = textContent.trim();
    const filename = path.join(
      textDir,
      `${Date.now()}_${visitorHash}_${submissionId}.txt`
    );

    fs.writeFileSync(filename, formattedText, "utf8");

    /* =========================
       5️⃣ Session log (file)
       ========================= */
    fs.appendFileSync(
      sessionLogFile,
      `[${timestamp.toISOString()}] CHECK | session=${sessionId} | submission=${submissionId} | user=${visitorHash}\n`
    );

    /* =========================
       6️⃣ Update daily counter
       ========================= */
    let t = 1;

    if (user.last_submission_date === today) {
      t = user.t + 1;
    }

    await pool.query(
      "UPDATE users SET t = ?, last_submission_date = ? WHERE id = ?",
      [t, today, userId]
    );

    /* =========================
       7️⃣ Insert user_logs
       ========================= */
    await pool.query(
      `INSERT INTO user_logs (
        user_id,
        action,
        session_id,
        submission_id,
        status,
        submission_date,
        submission_time,
        file_name,
        t,
        book_order_name,
        extra_info
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        "check_clicked",
        sessionId,
        submissionId,
        "pending",
        today,
        timestamp,
        filename,
        t,
        bookOrderName,
        JSON.stringify({
          length: formattedText.length,
          visitorHash
        })
      ]
    );

    /* =========================
       8️⃣ Respond to frontend
       ========================= */
    res.json({
      status: "accepted",
      submissionId
    });

  } catch (err) {
    console.error("[CheckRoute]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;