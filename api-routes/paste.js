import express from "express";
import fs from "fs-extra";
import path from "path";

const router = express.Router();
const textDir = path.join(process.cwd(), "saved_texts");
fs.ensureDirSync(textDir);

const sessionLogFile = path.join(process.cwd(), "logs", "session.log");

// POST /paste → save text content
router.post("/", (req, res) => {
  const { textContent } = req.body;
  if (!textContent) {
    return res.status(400).json({ error: "No text provided" });
  }

  const visitorId = req.session?.visitorId || req.session?.id || "unknown";
  const filename = path.join(textDir, `${Date.now()}_${visitorId}.txt`);

  fs.writeFileSync(filename, textContent, "utf8");

  const sessionLog = `[${new Date().toISOString()}] Paste - SID: ${req.session.id}, VisitorID: ${visitorId}, File: ${filename}\n`;
  fs.appendFileSync(sessionLogFile, sessionLog);

  res.json({ status: "success", message: "Text saved", filename });
});

export default router;