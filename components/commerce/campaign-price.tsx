"use client";

import {
  getDiscountedPrice,
  isSaleAvailable,
  saleCampaign,
} from "@/data/campaign";
import { formatProductPrice } from "@/data/products";
import { useCampaign } from "@/components/commerce/campaign-provider";

export function CampaignPrice({
  price,
  pendingLabel,
  compact = false,
}: {
  price: number | null;
  pendingLabel: string;
  compact?: boolean;
}) {
  const status = useCampaign();
  const available = isSaleAvailable(status);

  if (price === null) {
    return (
      <span className="campaign-price campaign-price--pending">
        <strong>{pendingLabel}</strong>
        {available ? (
          <small>خصم {saleCampaign.discountPercent}% يُطبّق بعد تأكيد السعر</small>
        ) : null}
      </span>
    );
  }

  if (!available) return <strong>{formatProductPrice(price)}</strong>;

  return (
    <span className={`campaign-price${compact ? " campaign-price--compact" : ""}`}>
      <span className="campaign-price__topline">
        <del>{formatProductPrice(price)}</del>
        <b>خصم {saleCampaign.discountPercent}%</b>
      </span>
      <strong>{formatProductPrice(getDiscountedPrice(price))}</strong>
    </span>
  );
}
