"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import type { Product } from "@/data/products";
import type { StoreOffer } from "@/data/offers";
import { getCartSubtotal, repriceCartItems } from "@/lib/cart-pricing";
import { useCart } from "@/components/commerce/cart-provider";
import { CampaignPrice } from "@/components/commerce/campaign-price";
import { useCampaign } from "@/components/commerce/campaign-provider";
import {
  getDiscountedPrice,
  isSaleAvailable,
  saleCampaign,
} from "@/data/campaign";

export function CartView({ products, offers }: { products: Product[]; offers: StoreOffer[] }) {
  const { items: savedItems, updateQuantity, removeItem } = useCart();
  const items = useMemo(() => repriceCartItems(savedItems, products, offers), [savedItems, products, offers]);
  const campaignStatus = useCampaign();
  const saleAvailable = isSaleAvailable(campaignStatus);
  const hasPendingPrice = items.some(
    (item) => typeof item.unitPrice !== "number",
  );
  const listSubtotal = getCartSubtotal(items);
  const originalSubtotal = hasPendingPrice ? null : items.reduce((sum, item) => sum + (item.listUnitPrice ?? item.unitPrice ?? 0) * item.quantity, 0);
  const productDiscount = originalSubtotal !== null && listSubtotal !== null ? Math.max(0, originalSubtotal - listSubtotal) : 0;
  const cashDiscount =
    listSubtotal === null || !saleAvailable
      ? 0
      : listSubtotal - getCartSubtotal(items, (price) => getDiscountedPrice(price, "cod"))!;
  const electronicDiscount =
    listSubtotal === null || !saleAvailable
      ? 0
      : listSubtotal - getCartSubtotal(items, (price) => getDiscountedPrice(price, "kashier"))!;

  if (!items.length) {
    return (
      <div className="empty-state">
        <span className="empty-state__code" dir="ltr">
          CART / 00
        </span>
        <h2>السلة لسه فاضية.</h2>
        <p>
          اختار المنتجات والأحجام، وبعدها ابعت طلبك عشان نأكد السعر والتوفر.
        </p>
        <Link className="fit-button-primary" href="/products">
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-layout">
      <div className="cart-items" aria-live="polite">
        {items.map((item) => (
          <article className="cart-item" key={item.key}>
            <Image
              src={item.image}
              alt={`صورة ${item.name}`}
              width={120}
              height={150}
            />
            <div className="cart-item__copy">
              <p dir="ltr">{item.name}</p>
              {item.offerTitle ? <small className="cart-item__offer">{item.offerUnavailable ? "العرض انتهى أو كمية الباقة اتغيرت؛ السعر الحالي للمنتج هو اللي بيتطبق." : `ضمن باقة ${item.offerTitle}`}</small> : null}
              <h2>{item.sizeLabel}</h2>
              <CampaignPrice
                compact
                price={
                  typeof item.unitPrice === "number" ? item.unitPrice : null
                }
                originalPrice={item.listUnitPrice}
                pendingLabel="السعر بعد تأكيد التوفر"
              />
            </div>
            <div className="cart-item__controls">
              <label>
                <span>الكمية</span>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) =>
                    updateQuantity(item.key, Number(event.target.value))
                  }
                />
              </label>
              <button
                className="text-button"
                type="button"
                onClick={() => removeItem(item.key)}
              >
                حذف
              </button>
            </div>
          </article>
        ))}
      </div>
      <aside className="cart-summary">
        <p className="section-heading__kicker">ملخص الطلب</p>
        <h2>نأكد التفاصيل معاك.</h2>
        <dl>
          <div>
            <dt>عدد المنتجات</dt>
            <dd>{items.reduce((total, item) => total + item.quantity, 0)}</dd>
          </div>
          {productDiscount > 0 ? <>
            <div><dt>قيمة المنتجات قبل خصم المنتج</dt><dd>{originalSubtotal?.toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ج.م</dd></div>
            <div className="cart-summary__discount"><dt>توفير خصومات المنتجات والباقات</dt><dd>{productDiscount.toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ج.م</dd></div>
          </> : null}
          <div>
            <dt>{saleAvailable ? "المجموع قبل خصم الدفع" : "إجمالي المنتجات"}</dt>
            <dd>
              {listSubtotal === null
                ? "قيد التأكيد"
                : `${listSubtotal.toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ج.م`}
            </dd>
          </div>
          {saleAvailable ? (
            <>
              <div className="cart-summary__discount">
                <dt>عند الاستلام · خصم {saleCampaign.discountPercent}%</dt>
                <dd>
                  {listSubtotal === null
                    ? "يُطبّق بعد التأكيد"
                    : `${(listSubtotal - cashDiscount).toLocaleString("ar-EG")} ج.م`}
                </dd>
              </div>
              <div className="cart-summary__discount cart-summary__discount--best">
                <dt>دفع إلكتروني · خصم {saleCampaign.electronicDiscountPercent}%</dt>
                <dd>
                  {listSubtotal === null
                    ? "يُطبّق بعد التأكيد"
                    : `${(listSubtotal - electronicDiscount).toLocaleString("ar-EG")} ج.م`}
                </dd>
              </div>
            </>
          ) : null}
          <div>
            <dt>الشحن</dt>
            <dd>يُحسب حسب المحافظة والمدينة</dd>
          </div>
        </dl>
        {saleAvailable ? (
          <p className="payment-discount-notice" role="note">
            ادفع إلكترونيًا ووفر {saleCampaign.electronicDiscountPercent}%، أو اختار الدفع عند الاستلام وخد خصم {saleCampaign.discountPercent}%.
          </p>
        ) : null}
        <Link className="fit-button-primary" href="/checkout">
          كمل طلبك
        </Link>
        <Link className="summary-link" href="/products">
          أضف منتج تاني
        </Link>
      </aside>
    </div>
  );
}
