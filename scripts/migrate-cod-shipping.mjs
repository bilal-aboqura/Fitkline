import process from "node:process";
import nextEnv from "@next/env";
import pg from "pg";

nextEnv.loadEnvConfig(process.cwd());
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("Missing DIRECT_URL or DATABASE_URL.");
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query(`
    begin;
    alter table public.fitkline_orders add column if not exists payment_plan jsonb;
    create or replace function public.fitkline_phone_key(phone text)
    returns text language sql immutable strict set search_path = public as $$
      select regexp_replace(
        regexp_replace(translate(phone, '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789'), '[^0-9]', '', 'g'),
        '^(0020|20|0)?(1[0125][0-9]{8})$', '\\2');
    $$;
    create index if not exists fitkline_orders_customer_phone_key_idx
      on public.fitkline_orders (public.fitkline_phone_key(customer->>'phone'));
    create or replace function public.fitkline_customer_history(p_phone text)
    returns jsonb language sql stable security invoker set search_path = public as $$
      select coalesce(jsonb_agg(jsonb_build_object(
        'order_status', order_status, 'bosta', bosta, 'mylerz', mylerz
      )), '[]'::jsonb)
      from public.fitkline_orders
      where public.fitkline_phone_key(customer->>'phone') = p_phone;
    $$;
    revoke all on function public.fitkline_customer_history(text) from public, anon, authenticated;
    grant execute on function public.fitkline_customer_history(text) to service_role;
    notify pgrst, 'reload schema';
    commit;
  `);
} finally {
  await client.end();
}
console.log("Fitkline COD shipping migration completed.");
