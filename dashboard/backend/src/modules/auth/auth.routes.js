// src/modules/auth/auth.routes.js
import { Router } from "express";
import { registerController, loginController } from "./auth.controller.js"; // adjust if different

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const payload = req.body;
    const user = await registerController(payload);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginController({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
