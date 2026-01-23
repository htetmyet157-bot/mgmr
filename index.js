import 'dotenv/config';
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import session from "express-session";
import MySQLStore from "express-mysql-session";
import fs from "fs";
import util from "util";
import { pool } from "./backend/db.js"; // your existing DB pool

// Middleware & services
import { headerCheck } from "./middleware/header.js";
import { cookieGenerator } from "./middleware/cookieGenerator.js";
import { cookieDBCheck } from "./middleware/cookieDBCheck.js";
// Routes
import Protectedapi from "./api-routes/protected.js";
import external from "./api-routes/external.js";

const app = express();
const PORT = 3000;
const projectRoot = process.cwd();

// ===== Directories =====
import fsExtra from "fs-extra";
fsExtra.ensureDirSync(path.join(projectRoot, "logs"));
fsExtra.ensureDirSync(path.join(projectRoot, "saved_texts"));

// ===== Morgan HTTP Logging =====
const logStream = fs.createWriteStream(
  path.join(projectRoot, "logs", "access.log"),
  { flags: "a" }
);
app.use(morgan("combined", { stream: logStream }));
app.use(morgan("dev"));

// ===== Core Parsers =====
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
      },
    },
  })
);

// ===== SQL Logging =====
const sqlLogStream = fs.createWriteStream(
  path.join(projectRoot, "logs", "sql.log"),
  { flags: "a" } // append mode
);

const originalQuery = pool.query.bind(pool);
pool.query = async function (...args) {
  const sql = args[0];
  const values = args[1];
  const timestamp = new Date().toISOString();

  sqlLogStream.write(`[${timestamp}] SQL: ${sql}\n`);
  if (values) sqlLogStream.write(`[${timestamp}] Values: ${util.inspect(values)}\n`);

  return originalQuery(...args);
};

// ===== Static files =====
app.use("/assets", express.static(path.join(projectRoot, "assets")));
app.get("/", (req, res) => res.sendFile(path.join(projectRoot, "index.html")));

// ===== API boundary =====
app.use(headerCheck);

// Test DB connection
pool.getConnection()
  .then(conn => {
    console.log("[DB] Connected successfully as mgmr_user");
    conn.release();
  })
  .catch(err => {
    console.error("[DB] Connection failed:", err);
  });

// ===== Session Setup =====
const MySQLSessionStore = MySQLStore(session);
const sessionStore = new MySQLSessionStore(
  {
    tableName: "sessions",
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: 24 * 60 * 60 * 1000,
  },
  pool
);
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "super-secret-key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    },
  })
);

// Cookie generator & routes
app.use("/middleware", cookieGenerator);
app.use("/api-routes", Protectedapi);
app.use("/api-routes", external);

// ===== Start server =====
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));