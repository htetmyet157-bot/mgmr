export function headerCheck(req, res, next) {
  const userAgent = req.headers["user-agent"];
  if (!userAgent) {
    return res.status(400).json({ status: "rejected", reason: "Missing User-Agent" });
  }
  next();
}