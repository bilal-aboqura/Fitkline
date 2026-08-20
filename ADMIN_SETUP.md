# Fitkline Admin, Payments & Notifications Setup

## 1. Environment

Copy `.env.example` to `.env.local` and set:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.example

BOSTA_API_KEY=
BOSTA_WEBHOOK_SECRET=use-a-random-secret
BOSTA_PICKUP_HAS_FRAGILE_ITEMS=false
BOSTA_PICKUP_NOTES=Fitkline automatic confirmed orders pickup
CRON_SECRET=use-another-random-secret

ADMIN_PASSWORD=use-a-strong-private-password
ADMIN_SESSION_SECRET=use-a-random-secret-with-at-least-24-characters

KASHIER_MERCHANT_ID=
KASHIER_API_KEY=
KASHIER_SECRET_KEY=
KASHIER_MODE=test

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
```

Restart the Next.js server after changing environment variables.

Run the idempotent database migration once for each Supabase project:

```bash
npm run db:migrate
```

The migration creates only namespaced `fitkline_*` tables and the public
`fitkline-assets` bucket, so it can share a Supabase project with another app
without changing that app's tables.

For an existing database that only needs the Bosta fields, run:

```bash
npm run db:migrate:bosta
```

## 2. Admin access

Open `/admin/login`.

The dashboard includes:

- overview and operational status;
- site identity, navigation, homepage copy, all internal page copy, contact
  form labels/options/messages, and public settings;
- products, 4 kg and 20 kg images, copy, prices, stock, and visibility;
- all 27 Egyptian governorates, their cities/areas, availability, a default
  shipping price per governorate, and optional city-specific overrides;
- image upload for PNG, JPG, and WebP;
- order search, details, payment state, and fulfillment state;
- privacy-conscious visitor analytics, page views, traffic sources, devices,
  popular pages, and approximate order conversion;
- Kashier readiness without exposing secret values.
- Bosta shipment creation, live shipping state, tracking number, and AWB print.

## 3. Kashier flow

Fitkline uses Kashier Payment Sessions:

1. Fitkline validates the cart and recalculates prices on the server.
2. The order is persisted before payment starts.
3. The server creates a short-lived Kashier session.
4. The customer pays on Kashier's hosted page.
5. Fitkline verifies the session server-to-server before marking an order paid.

Kashier is shown at checkout only when:

- it is enabled in `settings.kashierEnabled`;
- all three server credentials are configured;
- every item in the cart has a configured price.

No raw card data is submitted to or stored by Fitkline.

## 4. Bosta shipping and webhook

The orders page can create a Bosta delivery, show its tracking number and live
shipping state, refresh it on demand, and download the Arabic A4 AWB. Fitkline
sends the order reference as Bosta's `businessReference`, so webhook updates
are matched back to the correct order.

For deliveries that existed in Bosta before this integration, use **مزامنة كل
أوردرات بوسطة** on the orders page. The importer matches an existing tracking
number first, then the exact business reference, then a unique normalized phone
number. Ambiguous or unmatched deliveries are never attached automatically.

Each created delivery includes this authenticated webhook automatically:

```text
https://your-domain.example/api/webhooks/bosta
```

The custom header name is `x-fitkline-bosta-webhook`; its value is the private
`BOSTA_WEBHOOK_SECRET`. You may also enter the same URL, header name, and value
on Bosta's API Integration page to make it the account-wide webhook. Never put
the API key or webhook secret in client-side code.

The Bosta account must have a default pickup location. Fitkline resolves the
stored Egyptian governorate and city/area against Bosta's current public zoning
API before creating the delivery, and Bosta remains the final validator of
coverage.

### Automatic daily pickup

Vercel calls the protected pickup automation twice around midnight to cover both
Egypt standard time and daylight-saving time. The handler runs only when the
local Cairo hour is exactly 00:00 (12:00 AM), so only one call can proceed. It then:

1. Selects every uncollected order whose execution state is `confirmed`.
2. Stops without creating a pickup when fewer than 3 are available; those
   orders stay eligible for the following day.
3. Creates any missing Bosta deliveries and keeps their exact tracking states.
4. Uses Bosta's first available pickup date, default pickup location/contact,
   and the selected delivery tracking numbers.
5. Creates one pickup for all eligible parcels and marks the orders processing.
6. Downloads the Arabic AWBs, arranges every two labels vertically on one A4
   sheet, and sends the schedule plus the combined PDF to the configured
   Telegram destination. An odd final label stays in the top half of its own
   sheet. Failed Telegram documents are retried on a later automation run.

The schedule is declared in `vercel.json`. Add `CRON_SECRET` to the Production
environment in Vercel; Vercel sends it as a Bearer token automatically.

## 5. Telegram order notifications

Set `TELEGRAM_BOT_TOKEN` to the token for the existing bot and
`TELEGRAM_CHAT_ID` to the private chat, group, or channel that should receive
orders. Add the bot to that destination and give it permission to post there.

After an order is saved, Fitkline sends an Arabic notification containing the
reference, customer and delivery details, products, totals, and payment state.
If Telegram is unavailable, the saved customer order remains successful and
the notification error is recorded in the server logs.

## 6. Storage

- CMS content and products: `fitkline_cms_documents`
- Orders: `fitkline_orders`
- Anonymous page-view analytics: `fitkline_analytics_events`
- Governorates and shipping defaults: `fitkline_governorates`
- Cities and shipping overrides: `fitkline_cities`
- Uploaded images: `fitkline-assets`

All application access uses the server-side service-role key. RLS is enabled,
and the browser never receives the service-role key or direct table access.
The local JSON files remain only as migration seeds and are not written at
runtime.

Analytics uses random browser and session identifiers. It does not persist raw
IP addresses, names, or full user-agent strings. A “visitor” is therefore an
approximate unique browser rather than a verified individual. Browsers with Do
Not Track enabled are excluded.

The migration seeds Egyptian governorates and city/area names from
`sabrysuleiman/Egypt-Governorates-Cities-JSON` (GPL-3.0). Commercial shipping
prices are intentionally left empty until they are set from the admin panel.
