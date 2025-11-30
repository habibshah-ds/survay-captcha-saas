import fs from "fs";
import path from "path";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  await client.connect();

  const migrationsDir = path.resolve("migrations");
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql"));

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file)).toString();
    console.log("Running:", file);

    try {
      await client.query(sql);
      console.log("OK:", file);
    } catch (err) {
      console.error("ERROR:", file, err);
      process.exit(1);
    }
  }

  await client.end();
}

run();
