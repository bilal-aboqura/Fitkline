import { readFile } from "node:fs/promises";
import process from "node:process";
import nextEnv from "@next/env";
import pg from "pg";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Missing DIRECT_URL or DATABASE_URL.");
}

const sql = await readFile(
  new URL("./analytics-schema.sql", import.meta.url),
  "utf8",
);
const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(sql);
} finally {
  await client.end();
}

console.log("Fitkline analytics migration completed.");
