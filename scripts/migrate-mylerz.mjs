import process from "node:process";
import nextEnv from "@next/env";
import pg from "pg";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("Missing DIRECT_URL or DATABASE_URL.");

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(`
    alter table public.fitkline_orders
      add column if not exists mylerz jsonb;

    create unique index if not exists fitkline_orders_mylerz_tracking_idx
      on public.fitkline_orders ((mylerz ->> 'trackingNumber'))
      where mylerz ->> 'trackingNumber' is not null;
  `);
} finally {
  await client.end();
}

console.log("Fitkline Mylerz migration completed.");
