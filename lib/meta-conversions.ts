import "server-only";

import crypto from "node:crypto";
import { META_PIXEL_ID } from "@/components/analytics/meta-config";
import type { StoredOrder } from "@/lib/order-store";

const ACCESS_TOKEN = process.env.META_CONVERSIONS_API_ACCESS_TOKEN;
const API_VERSION = process.env.META_CONVERSIONS_API_VERSION ?? "v24.0";

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizedPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  // Egyptian mobile numbers are normally entered locally as 01xxxxxxxxx.
  return /^01\d{9}$/.test(digits) ? `20${digits.slice(1)}` : digits;
}

/** Sends a server-side custom Meta event after an order becomes cancelled. */
export async function sendMetaOrderCancelled(order: StoredOrder) {
  if (!ACCESS_TOKEN) return;

  const email = order.customer.email.trim().toLowerCase();
  const phone = normalizedPhone(order.customer.phone);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${META_PIXEL_ID}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [
            {
              event_name: "OrderCancelled",
              event_time: Math.floor(Date.now() / 1000),
              event_id: `order-cancelled-${order.reference}`,
              action_source: "website",
              user_data: {
                ...(email ? { em: [sha256(email)] } : {}),
                ...(phone ? { ph: [sha256(phone)] } : {}),
              },
              custom_data: {
                order_id: order.reference,
                order_status: "cancelled",
                currency: order.currency,
                ...(order.total !== null ? { value: order.total } : {}),
                content_type: "product",
                content_ids: order.items.map((item) => `${item.slug}-${item.sizeId}`),
                contents: order.items.map((item) => ({
                  id: `${item.slug}-${item.sizeId}`,
                  quantity: item.quantity,
                  ...(item.unitPrice !== null ? { item_price: item.unitPrice } : {}),
                })),
              },
            },
          ],
          access_token: ACCESS_TOKEN,
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      console.error(
        `[Meta CAPI] Failed to send cancellation for ${order.reference}: ${response.status}`,
      );
    }
  } catch (error) {
    console.error(`[Meta CAPI] Failed to send cancellation for ${order.reference}`, error);
  } finally {
    clearTimeout(timeout);
  }
}
