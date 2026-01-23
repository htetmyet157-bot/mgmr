import fs from "fs";
import path from "path";
import { createOrUpdateCookie } from "../backend/cookieService.js";

const logDir = path.join(process.cwd(), "logs");
fs.mkdirSync(logDir, { recursive: true });

export const cookieGenerator = async (req, res, next) => {
  try {
    const sessionId = req.session?.id || "no-session-id";
    const queuePosition = req.session?.queuePosition ?? null;
    const cfHeader = req.headers["cf-connecting-ip"] || "192.168.100.1";
    const timestampNow = new Date();

    let cookieData;

    if (!req.cookies.userData) {
      cookieData = { userId: sessionId, cfHeader, queuePosition, timestamp: timestampNow.toISOString(), t: 0 };
      res.cookie("userData", JSON.stringify(cookieData), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: 15 * 24 * 60 * 60 * 1000 }); // 1 month

      fs.appendFileSync(path.join(logDir, "cookie.log"), `[${timestampNow.toISOString()}] COOKIE CREATED: ${JSON.stringify(cookieData)}, IP: ${req.ip}, UA: ${req.headers["user-agent"]}\n`);

    } else {
      try {
        cookieData = JSON.parse(req.cookies.userData);
        if (new Date(cookieData.timestamp).toDateString() !== timestampNow.toDateString()) cookieData.t = 0;
        cookieData.timestamp = timestampNow.toISOString();

        res.cookie("userData", JSON.stringify(cookieData), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: 15 * 24 * 60 * 60 * 1000 });
        fs.appendFileSync(path.join(logDir, "cookie-updates.log"), `[${timestampNow.toISOString()}] COOKIE UPDATED: ${JSON.stringify(cookieData)}, IP: ${req.ip}, UA: ${req.headers["user-agent"]}\n`);

      } catch {
        cookieData = { userId: sessionId, cfHeader, queuePosition, timestamp: timestampNow.toISOString(), t: 0 };
        res.cookie("userData", JSON.stringify(cookieData), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: 15 * 24 * 60 * 60 * 1000 });
        fs.appendFileSync(path.join(logDir, "cookie.log"), `[${timestampNow.toISOString()}] COOKIE RE-GENERATED (parse fail): ${JSON.stringify(cookieData)}, IP: ${req.ip}, UA: ${req.headers["user-agent"]}\n`);
      }
    }

    // Save/update DB log
    await createOrUpdateCookie(cookieData);

    next();
  } catch (err) {
    console.error("[CookieGenerator] Unexpected error:", err);
    res.status(500).json({ status: "error", reason: "Cookie handling failed" });
  }
};