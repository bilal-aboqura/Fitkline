"use client";

import { useEffect } from "react";
import { trackMetaEvent } from "@/components/analytics/meta-events";

type PurchaseItem = {
  slug: string;
  sizeId: string;
  quantity: number;
  unitPrice: number | null;
};

export function MetaPurchaseEvent({
  reference,
  value,
  currency,
  items,
}: {
  reference: string;
  value: number;
  currency: string;
  items: PurchaseItem[];
}) {
  useEffect(() => {
    const storageKey = `fitkline-meta-purchase-${reference}`;
    if (window.localStorage.getItem(storageKey)) return;

    trackMetaEvent("Purchase", {
      value,
      currency,
      content_type: "product",
      content_ids: items.map((item) => `${item.slug}-${item.sizeId}`),
      contents: items.map((item) => ({
        id: `${item.slug}-${item.sizeId}`,
        quantity: item.quantity,
        ...(item.unitPrice !== null ? { item_price: item.unitPrice } : {}),
      })),
      num_items: items.reduce((total, item) => total + item.quantity, 0),
      order_id: reference,
    }, { eventId: `purchase-${reference}` });

    window.localStorage.setItem(storageKey, "1");
  }, [currency, items, reference, value]);

  return null;
}
