import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import routes from "./routes/index.js";

// load .env
dotenv.config();

const app = express();

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "*", // change later for security
  credentials: true
}));
app.use(helmet());
app.use(morgan("dev"));

// main routes
app.use("/api", routes);

// health check
app.get("/", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
