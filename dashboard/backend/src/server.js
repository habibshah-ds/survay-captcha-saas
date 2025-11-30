// backend/src/server.js
// -------------------------------------------------------------
//  ENTERPRISE BACKEND SERVER (ESM)
//  - Secure
//  - Scalable
//  - Low compute cost
//  - Multi-module architecture
//  - API versioning
//  - Compatible with PostgreSQL pool + migration system
// -------------------------------------------------------------

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import { connectDB } from "./db/index.js";        // PostgreSQL pool
import v1Routes from "./routes/v1/index.js";     // API v1 router
import errorHandler from "./middleware/errorHandler.js";

// Load .env early
dotenv.config();

// -------------------------------------------------------------
//  Initialize App
// -------------------------------------------------------------
const app = express();

// Trust reverse proxy (NGINX, Cloudflare, Render, etc.)
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

// -------------------------------------------------------------
//  SECURITY MIDDLEWARE (Enterprise Grade)
// -------------------------------------------------------------

// CORS — restrict origins for security
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173"],
    credentials: true
  })
);

// Security headers (XSS, clickjacking, MIME sniffing, etc.)
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false // allow charts, images, scripts
  })
);

// Prevent brute-force attacks
const globalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 1200,                // 1200 requests / 10 minutes
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

// Reduce response size (lower compute + cost)
app.use(compression());

// Cookies
app.use(cookieParser());

// Allow JSON bodies
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// -------------------------------------------------------------
//  Database Connection Boot
// -------------------------------------------------------------
await connectDB(); // connects PostgreSQL pool + tests connection

// -------------------------------------------------------------
//  HEALTHCHECK (Kubernetes + Load Balancers use)
// -------------------------------------------------------------
app.get("/health", async (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    timestamp: Date.now()
  });
});

// -------------------------------------------------------------
//  VERSIONED API ROUTES
// -------------------------------------------------------------
app.use("/api/v1", v1Routes);

// -------------------------------------------------------------
//  ERROR HANDLER (MUST BE LAST)
// -------------------------------------------------------------
app.use(errorHandler);

// -------------------------------------------------------------
//  START SERVER
// -------------------------------------------------------------
const PORT = Number(process.env.PORT || 5000);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 Dashboard Backend running on port ${PORT}`);
  });
}

export default app;
