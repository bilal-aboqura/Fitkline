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
  presentation = "default",
}: {
  price: number | null;
  pendingLabel: string;
  compact?: boolean;
  presentation?: "default" | "configurator";
}) {
  const status = useCampaign();
  const available = isSaleAvailable(status);
  const configurator = presentation === "configurator";

  if (price === null) {
    return (
      <span
        className={`campaign-price campaign-price--pending${configurator ? " campaign-price--configurator" : ""}`}
      >
        <strong>{pendingLabel}</strong>
        {available ? (
          <small>
            خصم {saleCampaign.discountPercent}% عند الاستلام أو {saleCampaign.electronicDiscountPercent}% للدفع الإلكتروني
          </small>
        ) : null}
      </span>
    );
  }

  if (!available) {
    return configurator ? (
      <span className="campaign-price campaign-price--configurator campaign-price--standard">
        <strong dir="ltr">{formatProductPrice(price)}</strong>
      </span>
    ) : (
      <strong>{formatProductPrice(price)}</strong>
    );
  }

  if (configurator) {
    return (
      <div className="campaign-price campaign-price--configurator">
        <div className="campaign-price__original">
          <span>السعر الأصلي</span>
          <del dir="ltr">{formatProductPrice(price)}</del>
        </div>
        <div
          className="campaign-price__payment-list"
          role="list"
          aria-label="الأسعار حسب طريقة الدفع"
        >
          <div className="campaign-price__payment-row" role="listitem">
            <span className="campaign-price__method">
              <b>عند الاستلام</b>
              <small>خصم {saleCampaign.discountPercent}%</small>
            </span>
            <strong dir="ltr">
              {formatProductPrice(getDiscountedPrice(price, "cod"))}
            </strong>
          </div>
          <div className="campaign-price__payment-row" role="listitem">
            <span className="campaign-price__method">
              <b>الدفع الإلكتروني</b>
              <small>خصم {saleCampaign.electronicDiscountPercent}%</small>
            </span>
            <strong dir="ltr">
              {formatProductPrice(getDiscountedPrice(price, "kashier"))}
            </strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <span className={`campaign-price${compact ? " campaign-price--compact" : ""}`}>
      {compact ? (
        <span className="campaign-price__listing-summary">
          <del dir="ltr">{formatProductPrice(price)}</del>
          <span>
            <small>السعر يبدأ من</small>
            <strong dir="ltr">
              {formatProductPrice(getDiscountedPrice(price, "kashier"))}
            </strong>
          </span>
        </span>
      ) : null}
      <span className="campaign-price__desktop-details">
        <span className="campaign-price__topline">
          <del>{formatProductPrice(price)}</del>
          <b>خصم حسب طريقة الدفع</b>
        </span>
        <span className="campaign-price__payment-options">
          <strong>
            <small>عند الاستلام · خصم {saleCampaign.discountPercent}%</small>
            {formatProductPrice(getDiscountedPrice(price, "cod"))}
          </strong>
          <strong>
            <small>دفع إلكتروني · خصم {saleCampaign.electronicDiscountPercent}%</small>
            {formatProductPrice(getDiscountedPrice(price, "kashier"))}
          </strong>
        </span>
      </span>
    </span>
  );
}
