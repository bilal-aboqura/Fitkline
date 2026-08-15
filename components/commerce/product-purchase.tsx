"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trackMetaEvent } from "@/components/analytics/meta-events";
import { useCart } from "@/components/commerce/cart-provider";
import { CampaignPrice } from "@/components/commerce/campaign-price";
import { useCampaign } from "@/components/commerce/campaign-provider";
import {
  getDiscountedPrice,
  isSaleAvailable,
  saleCampaign,
} from "@/data/campaign";
import {
  formatProductPrice,
  getProductVariantHref,
  type Product,
  type ProductSize,
} from "@/data/products";

type ProductPurchaseProps = {
  product: Product;
  size: ProductSize;
};

export function ProductPurchase({ product, size }: ProductPurchaseProps) {
  const { addItem } = useCart();
  const campaignStatus = useCampaign();
  const [added, setAdded] = useState(false);
  const siblingSizes = product.sizes.filter((candidate) => candidate.active);
  const alternateSize = siblingSizes.find((candidate) => candidate.id !== size.id);
  const hasPrice = typeof size.price === "number";
  const saleAvailable = isSaleAvailable(campaignStatus);
  const effectivePrice = hasPrice && saleAvailable
    ? getDiscountedPrice(size.price)
    : size.price;
  const mobilePrice = hasPrice && saleAvailable
    ? getDiscountedPrice(size.price, "kashier")
    : size.price;
  const isOutOfStock = size.stock === 0;

  useEffect(() => {
    trackMetaEvent("ViewContent", {
      content_ids: [`${product.slug}-${size.id}`],
      content_name: `${product.name} ${size.label}`,
      content_type: "product",
      currency: "EGP",
      ...(typeof effectivePrice === "number" ? { value: effectivePrice } : {}),
    });
  }, [effectivePrice, product.name, product.slug, size.id, size.label]);

  function handleAdd() {
    if (isOutOfStock) return;

    addItem({
      slug: product.slug,
      name: product.name,
      sizeId: size.id,
      sizeLabel: size.label,
      unitPrice: size.price,
      image: product.sizeImages[size.id] ?? product.image,
    });
    trackMetaEvent("AddToCart", {
      content_ids: [`${product.slug}-${size.id}`],
      content_name: `${product.name} ${size.label}`,
      content_type: "product",
      contents: [{
        id: `${product.slug}-${size.id}`,
        quantity: 1,
        ...(typeof effectivePrice === "number" ? { item_price: effectivePrice } : {}),
      }],
      currency: "EGP",
      ...(typeof effectivePrice === "number" ? { value: effectivePrice } : {}),
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2600);
  }

  return (
    <div className="purchase-panel" id="purchase-panel">
      <section className="purchase-panel__price" aria-labelledby="purchase-price-title">
        <h2 id="purchase-price-title">السعر</h2>
        <CampaignPrice
          price={size.price}
          pendingLabel={product.priceLabel}
          presentation="configurator"
        />
      </section>

      {saleAvailable ? (
        <div className="purchase-panel__campaign" role="note">
          <span className="purchase-panel__campaign-icon" aria-hidden="true">%</span>
          <span className="purchase-panel__campaign-copy">
            <b>الخصم يُطبّق تلقائيًا</b>
            <span className="purchase-panel__campaign-details">
              <span>حسب طريقة الدفع في الخطوة الأخيرة</span>
              <small>لأول {saleCampaign.customerLimit} عميل</small>
            </span>
          </span>
        </div>
      ) : null}

      <section className="purchase-panel__sizes" aria-labelledby="purchase-size-title">
        <div className="purchase-panel__variant">
          <h2 id="purchase-size-title">الحجم</h2>
          <p>
            المحدد
            <strong dir="ltr">{size.label}</strong>
          </p>
        </div>

        {siblingSizes.length > 1 ? (
          <nav className="variant-links" aria-label="عبوات المنتج المتاحة">
            <div className="variant-links__options">
              {siblingSizes.map((candidate) =>
                candidate.id === size.id ? (
                  <span className="is-current" key={candidate.id} aria-current="page">
                    <span dir="ltr">{candidate.label}</span>
                    <span className="variant-links__selected-mark" aria-hidden="true">✓</span>
                  </span>
                ) : (
                  <Link
                    key={candidate.id}
                    href={getProductVariantHref(product.slug, candidate.id)}
                    dir="ltr"
                  >
                    {candidate.label}
                  </Link>
                ),
              )}
            </div>
            {alternateSize ? (
              <Link
                className="variant-links__hint"
                href={getProductVariantHref(product.slug, alternateSize.id)}
              >
                <span aria-hidden="true">←</span>
                عرض عبوة <span dir="ltr">{alternateSize.label}</span>
              </Link>
            ) : null}
          </nav>
        ) : null}
      </section>

      <div className="purchase-panel__action">
        <button
          className="fit-button-primary purchase-panel__button"
          type="button"
          onClick={handleAdd}
          disabled={isOutOfStock}
        >
          {isOutOfStock
            ? "غير متوفر حاليًا"
            : added
              ? "اتضاف لطلبك ✓"
              : "أضف لطلبك"}
        </button>
        {added || !hasPrice ? (
          <p className="purchase-panel__note" aria-live="polite">
            {added
              ? "تقدر تراجع اختيارك في السلة أو تكمل إضافة منتجات تانية."
              : "السعر والتوفر بيتم تأكيدهم قبل تنفيذ الطلب."}
          </p>
        ) : null}
      </div>

      <div className="mobile-purchase-bar">
        <button
          className="fit-button-primary purchase-panel__mobile-button"
          type="button"
          onClick={handleAdd}
          disabled={isOutOfStock}
        >
          {isOutOfStock
            ? "غير متوفر حاليًا"
            : added
              ? "اتضاف لطلبك ✓"
              : `أضف ${size.label} لطلبك${typeof mobilePrice === "number" ? ` — ${formatProductPrice(mobilePrice)}` : ""}`}
        </button>
      </div>
    </div>
  );
}
