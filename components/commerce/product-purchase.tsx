"use client";

import { useState } from "react";
import { useCart } from "@/components/commerce/cart-provider";
import type { Product, ProductSize } from "@/data/products";

type ProductPurchaseProps = {
  product: Product;
  selectedSize?: ProductSize;
  onSizeChange?: (size: ProductSize) => void;
};

export function ProductPurchase({ product, selectedSize: controlledSize, onSizeChange }: ProductPurchaseProps) {
  const { addItem } = useCart();
  const [internalSize, setInternalSize] = useState(product.sizes[0]);
  const [added, setAdded] = useState(false);
  const selectedSize = controlledSize ?? internalSize;

  function handleSizeChange(size: ProductSize) {
    onSizeChange?.(size);
    if (!controlledSize) setInternalSize(size);
  }

  function handleAdd() {
    addItem({
      slug: product.slug,
      name: product.name,
      sizeId: selectedSize.id,
      sizeLabel: selectedSize.label,
      unitPrice: selectedSize.price,
      image: product.sizeImages[selectedSize.id] ?? product.image,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2600);
  }

  return (
    <div className="purchase-panel" id="purchase-panel">
      <div className="purchase-panel__price">
        <span>السعر</span>
        <strong>{product.priceLabel}</strong>
      </div>

      <fieldset className="size-selector">
        <legend>اختار الحجم</legend>
        <div className="size-selector__options">
          {product.sizes.map((size) => (
            <label className={selectedSize.id === size.id ? "is-selected" : ""} key={size.id}>
              <input type="radio" name={`${product.slug}-size`} value={size.id} checked={selectedSize.id === size.id} onChange={() => handleSizeChange(size)} />
              <span>{size.label}</span>
              <small>تأكيد السعر</small>
            </label>
          ))}
        </div>
      </fieldset>

      <button className="fit-button-primary purchase-panel__button" type="button" onClick={handleAdd}>
        {added ? "اتضاف لطلبك ✓" : "أضف لطلبك"}
      </button>
      <p className="purchase-panel__note" aria-live="polite">
        {added ? "تقدر تراجع اختياراتك في السلة أو تكمل إضافة منتجات أخرى." : "السعر والتوفر يتم تأكيدهما قبل تنفيذ الطلب."}
      </p>
    </div>
  );
}
