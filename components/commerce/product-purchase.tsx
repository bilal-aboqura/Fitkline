"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trackMetaEvent } from "@/components/analytics/meta-events";
import { useCart } from "@/components/commerce/cart-provider";
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
  const [added, setAdded] = useState(false);
  const siblingSizes = product.sizes.filter((candidate) => candidate.active);
  const hasPrice = typeof size.price === "number";
  const isOutOfStock = size.stock === 0;

  useEffect(() => {
    trackMetaEvent("ViewContent", {
      content_ids: [`${product.slug}-${size.id}`],
      content_name: `${product.name} ${size.label}`,
      content_type: "product",
      currency: "EGP",
      ...(typeof size.price === "number" ? { value: size.price } : {}),
    });
  }, [product.name, product.slug, size.id, size.label, size.price]);

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
        ...(typeof size.price === "number" ? { item_price: size.price } : {}),
      }],
      currency: "EGP",
      ...(typeof size.price === "number" ? { value: size.price } : {}),
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2600);
  }

  return (
    <div className="purchase-panel" id="purchase-panel">
      <div className="purchase-panel__price">
        <span>السعر</span>
        <strong>{hasPrice ? formatProductPrice(size.price) : product.priceLabel}</strong>
      </div>

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
