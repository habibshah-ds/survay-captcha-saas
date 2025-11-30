// FILE: backend/src/modules/auth/auth.controller.js
import { register, login } from "./auth.service.js";

export const registerController = async (req, res) => {
  try {
    const user = await register(req.body);
    res.status(201).json({ success: true, user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

export const loginController = async (req, res) => {
  try {
    const result = await login(req.body);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("Login error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};
