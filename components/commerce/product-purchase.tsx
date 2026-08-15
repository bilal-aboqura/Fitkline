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
  const hasPrice = typeof size.price === "number";
  const saleAvailable = isSaleAvailable(campaignStatus);
  const effectivePrice = hasPrice && saleAvailable
    ? getDiscountedPrice(size.price)
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
      <div className="purchase-panel__price">
        <span>السعر</span>
        <CampaignPrice price={size.price} pendingLabel={product.priceLabel} />
      </div>

      {saleAvailable ? (
        <div className="purchase-panel__campaign" role="note">
          <b>
            خصم {saleCampaign.discountPercent}% عند الاستلام أو {saleCampaign.electronicDiscountPercent}% للدفع الإلكتروني
          </b>
          <span>العرض متاح لأول {saleCampaign.customerLimit} عميل، والخصم بيتحسب تلقائيًا في صفحة الدفع.</span>
        </div>
      ) : null}

      <div className="purchase-panel__variant">
        <span>الحجم</span>
        <b dir="ltr">{size.label}</b>
      </div>

      {siblingSizes.length > 1 ? (
        <nav className="variant-links" aria-label="عبوات المنتج المتاحة">
          <span>شوف العبوة التانية</span>
          <div>
            {siblingSizes.map((candidate) =>
              candidate.id === size.id ? (
                <span className="is-current" key={candidate.id} aria-current="page">
                  {candidate.label}
                </span>
              ) : (
                <Link
                  key={candidate.id}
                  href={getProductVariantHref(product.slug, candidate.id)}
                >
                  {candidate.label}
                </Link>
              ),
            )}
          </div>
        </nav>
      ) : null}

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
  );
}
