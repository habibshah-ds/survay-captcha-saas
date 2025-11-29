import * as AuthService from "./auth.service.js";

export const registerController = async (req, res) => {
  try {
    const user = await AuthService.register(req.body);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const loginController = async (req, res) => {
  try {
    const { token, user } = await AuthService.login(req.body);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
    });

    res.json({ user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const meController = async (req, res) => {
  res.json({ user: req.user });
};
