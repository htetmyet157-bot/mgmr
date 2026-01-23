// /apiProtected.js
import express from "express";
import pasteRoute from "./paste.js";
import checkRoute from "./check.js";
import { cookieDBCheck } from "../middleware/cookieDBCheck.js";

const router = express.Router();

// Apply cookieDBCheck only to these routes
router.use("/paste", cookieDBCheck, pasteRoute);
router.use("/check", cookieDBCheck, checkRoute);

export default router;