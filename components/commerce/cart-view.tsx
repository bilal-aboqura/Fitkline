"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/commerce/cart-provider";

export function CartView() {
  const { items, updateQuantity, removeItem } = useCart();
  const hasPendingPrice = items.some(
    (item) => typeof item.unitPrice !== "number",
  );
  const subtotal = hasPendingPrice
    ? null
    : items.reduce(
        (total, item) => total + (item.unitPrice ?? 0) * item.quantity,
        0,
      );

  if (!items.length) {
    return (
      <div className="empty-state">
        <span className="empty-state__code" dir="ltr">CART / 00</span>
        <h2>السلة لسه فاضية.</h2>
        <p>اختار المنتجات والأحجام، وبعدها ابعت طلبك عشان نأكد السعر والتوفر.</p>
        <Link className="fit-button-primary" href="/products">تصفح المنتجات</Link>
      </div>
    );
  }

  return (
    <div className="cart-layout">
      <div className="cart-items" aria-live="polite">
        {items.map((item) => (
          <article className="cart-item" key={item.key}>
            <Image src={item.image} alt={`صورة ${item.name}`} width={120} height={150} />
            <div className="cart-item__copy">
              <p dir="ltr">{item.name}</p>
              <h2>{item.sizeLabel}</h2>
              <span>
                {typeof item.unitPrice === "number"
                  ? `${item.unitPrice.toLocaleString("ar-EG")} ج.م`
                  : "السعر بعد تأكيد التوفر"}
              </span>
            </div>
            <div className="cart-item__controls">
              <label>
                <span>الكمية</span>
                <input type="number" min="1" value={item.quantity} onChange={(event) => updateQuantity(item.key, Number(event.target.value))} />
              </label>
              <button className="text-button" type="button" onClick={() => removeItem(item.key)}>حذف</button>
            </div>
          </article>
        ))}
      </div>
      <aside className="cart-summary">
        <p className="section-heading__kicker">ملخص الطلب</p>
        <h2>نأكد التفاصيل معاك.</h2>
        <dl>
          <div><dt>عدد المنتجات</dt><dd>{items.reduce((total, item) => total + item.quantity, 0)}</dd></div>
          <div><dt>المجموع الفرعي</dt><dd>{subtotal === null ? "قيد التأكيد" : `${subtotal.toLocaleString("ar-EG")} ج.م`}</dd></div>
          <div><dt>الشحن</dt><dd>يُحسب حسب المحافظة والمدينة</dd></div>
        </dl>
        <Link className="fit-button-primary" href="/checkout">كمل طلبك</Link>
        <Link className="summary-link" href="/products">أضف منتج تاني</Link>
      </aside>
    </div>
  );
}
