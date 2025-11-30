import express from "express";
import { list, get, create, remove } from "../controllers/questionController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use(auth);

router.get("/", list);
router.get("/:id", get);
router.post("/", create);
router.delete("/:id", remove);

export default router;
