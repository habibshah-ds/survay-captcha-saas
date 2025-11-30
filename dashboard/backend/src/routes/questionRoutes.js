// backend/src/routes/questionRoutes.js
import express from "express";
import { create, list, remove } from "../controllers/questionController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Must be authenticated
router.use(authMiddleware);

router.get("/", list);
router.post("/", create);
router.delete("/:id", remove);

export default router;
