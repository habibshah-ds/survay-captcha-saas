import express from "express";
import questions from "./questions.js";

const router = express.Router();

router.use("/questions", questions);

export default router;
