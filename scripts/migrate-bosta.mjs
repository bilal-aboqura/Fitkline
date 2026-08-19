import process from "node:process";
import nextEnv from "@next/env";
import pg from "pg";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Missing DIRECT_URL or DATABASE_URL.");
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(`
    alter table public.fitkline_orders
      add column if not exists bosta jsonb;

    create unique index if not exists fitkline_orders_bosta_tracking_idx
      on public.fitkline_orders ((bosta ->> 'trackingNumber'))
      where bosta ->> 'trackingNumber' is not null;

    create table if not exists public.fitkline_bosta_pickups (
      automation_key text primary key,
      bosta_pickup_id text unique,
      puid text,
      scheduled_date date,
      scheduled_time_slot text,
      state text,
      business_location_id text,
      order_references jsonb not null default '[]'::jsonb,
      tracking_numbers jsonb not null default '[]'::jsonb,
      parcel_count integer not null default 0,
      telegram_sent boolean not null default false,
      status text not null,
      error text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index if not exists fitkline_bosta_pickups_scheduled_idx
      on public.fitkline_bosta_pickups (scheduled_date desc);

    alter table public.fitkline_bosta_pickups enable row level security;
    revoke all on public.fitkline_bosta_pickups from anon, authenticated;
    grant all on public.fitkline_bosta_pickups to service_role;
  `);
} finally {
  await client.end();
}

console.log("Fitkline Bosta migration completed.");
