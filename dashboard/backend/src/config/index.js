// src/config/index.js

import dotenv from "dotenv";
dotenv.config();

export const DATABASE_URL = process.env.DATABASE_URL;
export const JWT_SECRET = process.env.JWT_SECRET;

export const ACCESS_TOKEN_EXP = process.env.ACCESS_TOKEN_EXP || "15m";
export const REFRESH_TOKEN_EXP = process.env.REFRESH_TOKEN_EXP || "7d";

export const SITE_KEY = process.env.SITE_KEY || null;

