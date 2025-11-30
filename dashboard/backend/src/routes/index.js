import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import questionRoutes from "../modules/questions/question.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/questions", questionRoutes);

export default router;
