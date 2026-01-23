// ./api-routes/external.js
import express from "express";
import fs from "fs-extra";
import path from "path";
import { pool } from "../backend/db.js"; 
import cors from "cors";

const externalRouter = express.Router();
const textDir = path.join(process.cwd(), "saved_texts");

// ===== CORS & API key check =====
const ALLOWED_ORIGIN = "https://example.com"; // placeholder
const API_KEY = "secret-placeholder-key"; // placeholder

externalRouter.use(
  cors({
    origin: ALLOWED_ORIGIN,
  })
);

externalRouter.use((req, res, next) => {
  const key = req.headers["x-api-key"];
  if (key !== API_KEY) {
    return res.status(403).json({ status: "error", reason: "Unauthorized" });
  }
  next();
});

// ===== GET pending submissions =====
externalRouter.get("/pending", async (req, res) => {
  try {
    const [pendingLogs] = await pool.query(
      "SELECT submission_id, session_id, file_name, book_order_name FROM user_logs WHERE status='pending' ORDER BY id ASC"
    );

    const response = [];

    for (const log of pendingLogs) {
      const filePath = path.join(textDir, path.basename(log.file_name));
      if (!fs.existsSync(filePath)) continue; // skip missing files

      const content = fs.readFileSync(filePath, "utf8");

      response.push({
        submission_id: log.submission_id,
        session_id: log.session_id,
        book_order_name: log.book_order_name,
        text: content,
      });
    }

    res.json({ status: "ok", queue: response });
  } catch (err) {
    console.error("[External /pending]", err);
    res.status(500).json({ status: "error", reason: "Internal server error" });
  }
});

// ===== POST callback from external processor =====
externalRouter.post("/callback", async (req, res) => {
  try {
    const { submission_id, status } = req.body;

    if (!submission_id || !["success", "failed"].includes(status)) {
      return res.status(400).json({ status: "error", reason: "Invalid payload" });
    }

    const [result] = await pool.query(
      "UPDATE user_logs SET status = ? WHERE submission_id = ?",
      [status, submission_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", reason: "Submission not found" });
    }

    res.json({ status: "ok", submission_id, new_status: status });
  } catch (err) {
    console.error("[External /callback]", err);
    res.status(500).json({ status: "error", reason: "Internal server error" });
  }
});

export default externalRouter;