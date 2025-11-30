import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/index.js";

export default function authRequired(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Missing Authorization header" });
  const token = auth.replace(/^Bearer\s+/, "");
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
