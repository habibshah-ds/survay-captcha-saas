import { Router } from "express";
import auth from "../../middleware/auth.js";
import { createOrgController, myOrgController } from "./org.controller.js";

const router = Router();

router.post("/", auth, createOrgController);
router.get("/me", auth, myOrgController);

export default router;
