// backend/src/config/db.js
import pkg from "pg";
const { Pool } = pkg;
import { DATABASE_URL } from "./index.js";

export const db = new Pool({
  connectionString: DATABASE_URL,
  ssl: false, // set true for production with SSL PG
});

// Simple test
db.connect()
  .then((client) => {
    client.release();
    console.log("PostgreSQL connected successfully");
  })
  .catch((err) => {
    console.error("PostgreSQL connection error:", err.message);
  });
