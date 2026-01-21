import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// ---------------- Config ----------------
const app = express();
const PORT = 3000;

// ---------------- Directories ----------------
const projectRoot = process.cwd(); // project root
const logDir = path.join(projectRoot, "logs");
fs.ensureDirSync(logDir);

// ---------------- Log files ----------------
const accessLog = fs.createWriteStream(path.join(logDir, "access.log"), { flags: "a" });
const visitorLog = fs.createWriteStream(path.join(logDir, "visitor.log"), { flags: "a" });
const sessionLog = fs.createWriteStream(path.join(logDir, "session.log"), { flags: "a" });

// ---------------- Middleware ----------------
app.use(cookieParser());
app.use(helmet());
app.use(morgan("combined", { stream: accessLog }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------- Session ----------------
app.use(
  session({
    secret: "super-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 15 * 60 * 1000, // 15 min
      httpOnly: true,
      sameSite: "strict",
    },
  })
);

// ---------------- Session Logging with Duplicate Check ----------------
const lastSessionState = new Map(); // key: sessionID, value: JSON string of last state

app.use((req, res, next) => {
  try {
    // Assign visitor ID if new
    if (!req.session.visitorId) {
      req.session.visitorId = uuidv4();
      visitorLog.write(`[${new Date().toISOString()}] New visitor: ${req.session.visitorId}\n`);
    }

    // Queue placeholder (simulate integer value)
    if (!req.session.queuePosition) req.session.queuePosition = Math.floor(Math.random() * 100);

    // Persistent cookie for 1 month
    res.cookie("visitorId", req.session.visitorId, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
    });

    // Current session state (ignore timestamp)
    const currentState = JSON.stringify({
      visitorId: req.session.visitorId,
      queuePosition: req.session.queuePosition,
    });

    // Only log if state changed
    if (lastSessionState.get(req.session.id) !== currentState) {
      sessionLog.write(
        `[${new Date().toISOString()}] SessionID: ${req.session.id}, VisitorID: ${req.session.visitorId}, Queue: ${req.session.queuePosition}\n`
      );
      lastSessionState.set(req.session.id, currentState);
    }

  } catch (err) {
    console.error("Session middleware error:", err);
  }

  next();
});

// ---------------- Serve static files ----------------
app.use("/assets", express.static(path.join(projectRoot, "assets")));

// Serve index.html from project root
app.get("/", (req, res) => {
  res.sendFile(path.join(projectRoot, "index.html"), (err) => {
    if (err) console.error("Error sending index.html:", err);
  });
});

// ---------------- Example queue API ----------------
app.post("/queue", (req, res) => {
  const { position } = req.body;
  req.session.queuePosition = position ?? null;
  res.json({ visitorId: req.session.visitorId, queuePosition: req.session.queuePosition });
});

// ---------------- Start server ----------------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});