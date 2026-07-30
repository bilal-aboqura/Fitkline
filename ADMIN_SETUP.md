# Fitkline Admin & Kashier Setup

## 1. Environment

Copy `.env.example` to `.env.local` and set:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.example

ADMIN_PASSWORD=use-a-strong-private-password
ADMIN_SESSION_SECRET=use-a-random-secret-with-at-least-24-characters

KASHIER_MERCHANT_ID=
KASHIER_API_KEY=
KASHIER_SECRET_KEY=
KASHIER_MODE=test
```

Restart the Next.js server after changing environment variables.

## 2. Admin access

Open `/admin/login`.

The dashboard includes:

- overview and operational status;
- site identity, navigation, homepage copy, all internal page copy, contact
  form labels/options/messages, and public settings;
- products, 4 kg and 20 kg images, copy, prices, stock, and visibility;
- image upload for PNG, JPG, and WebP;
- order search, details, payment state, and fulfillment state;
- Kashier readiness without exposing secret values.

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

## 4. Storage note

Content and orders currently persist in `data/cms-content.json` and
`data/orders.json`. This is reliable for a local server or a deployment with a
persistent writable disk. Before deploying to a serverless platform with an
ephemeral/read-only filesystem, move these stores to a managed database while
keeping the same APIs.
