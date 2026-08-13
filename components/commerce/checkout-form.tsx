"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { trackMetaEvent } from "@/components/analytics/meta-events";
import { useCart } from "@/components/commerce/cart-provider";
import { useCampaign } from "@/components/commerce/campaign-provider";
import {
  getDiscountAmount,
  getDiscountedPrice,
  isSaleAvailable,
  saleCampaign,
} from "@/data/campaign";
import type { ShippingGovernorate } from "@/lib/shipping-store";

function money(value: number) {
  return `${value.toLocaleString("ar-EG", {
    minimumFractionDigits: value % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  })} ج.م`;
}

export function CheckoutForm({
  paymentOptions,
  shippingLocations,
}: {
  paymentOptions: { cod: boolean; kashier: boolean };
  shippingLocations: ShippingGovernorate[];
}) {
  const { items, clearCart } = useCart();
  const campaignStatus = useCampaign();
  const saleAvailable = isSaleAvailable(campaignStatus);
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [governorateId, setGovernorateId] = useState("");
  const [cityId, setCityId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "kashier">(
    paymentOptions.cod ? "cod" : "kashier",
  );
  const [loading, setLoading] = useState(false);
  const initiatedCheckout = useRef(false);

  const governorate = shippingLocations.find(
    (item) => item.id === governorateId,
  );
  const city = governorate?.cities.find((item) => item.id === Number(cityId));
  const shippingAmount = city
    ? (city.shippingPrice ?? governorate?.shippingPrice ?? null)
    : null;
  const hasPendingPrice = items.some(
    (item) => typeof item.unitPrice !== "number",
  );
  const listSubtotal = hasPendingPrice
    ? null
    : items.reduce(
        (total, item) => total + (item.unitPrice ?? 0) * item.quantity,
        0,
      );
  const discount =
    listSubtotal === null || !saleAvailable
      ? 0
      : items.reduce(
          (total, item) =>
            total +
            (typeof item.unitPrice === "number"
              ? getDiscountAmount(item.unitPrice) * item.quantity
              : 0),
          0,
        );
  const subtotal = listSubtotal === null ? null : listSubtotal - discount;
  const total =
    subtotal !== null && shippingAmount !== null
      ? subtotal + shippingAmount
      : null;

  useEffect(() => {
    if (!items.length || initiatedCheckout.current) return;
    initiatedCheckout.current = true;
    trackMetaEvent("InitiateCheckout", {
      content_type: "product",
      content_ids: items.map((item) => `${item.slug}-${item.sizeId}`),
      contents: items.map((item) => ({
        id: `${item.slug}-${item.sizeId}`,
        quantity: item.quantity,
        ...(typeof item.unitPrice === "number"
          ? {
              item_price: saleAvailable
                ? getDiscountedPrice(item.unitPrice)
                : item.unitPrice,
            }
          : {}),
      })),
      currency: "EGP",
      num_items: items.reduce((sum, item) => sum + item.quantity, 0),
      ...(subtotal !== null ? { value: subtotal } : {}),
    });
  }, [items, saleAvailable, subtotal]);
  const kashierAvailable =
    paymentOptions.kashier && total !== null && total > 0;

  const activeCities = governorate?.cities.filter((item) => item.active) ?? [];
  const effectivePaymentMethod =
    paymentMethod === "kashier" && !kashierAvailable && paymentOptions.cod
      ? "cod"
      : paymentMethod;

  if (submitted) {
    return (
      <div className="success-state" role="status">
        <span className="empty-state__code" dir="ltr">
          ORDER / {reference}
        </span>
        <h2>طلبك اتسجل بنجاح.</h2>
        <p>
          فريق Fitkline هيراجع الطلب ويتواصل معاك لتأكيد التنفيذ وموعد التوصيل.
        </p>
        <Link className="fit-button-primary" href="/products">
          ارجع للمنتجات
        </Link>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="empty-state">
        <h2>مفيش منتجات للتأكيد.</h2>
        <p>أضف منتجًا واحدًا على الأقل قبل إكمال الطلب.</p>
        <Link className="fit-button-primary" href="/products">
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          phone: formData.get("phone"),
          email: formData.get("email"),
          governorateId,
          cityId: Number(cityId),
          address: formData.get("address"),
          items,
          paymentMethod: effectivePaymentMethod,
        }),
      });
      const result = (await response.json()) as {
        reference?: string;
        redirectUrl?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error ?? "حصلت مشكلة في تسجيل الطلب.");
      }
      if (result.redirectUrl) {
        window.location.assign(result.redirectUrl);
        return;
      }
      const orderReference = result.reference ?? "FTK-REQUEST";
      if (total !== null) {
        trackMetaEvent(
          "Purchase",
          {
            value: total,
            currency: "EGP",
            content_type: "product",
            content_ids: items.map((item) => `${item.slug}-${item.sizeId}`),
            contents: items.map((item) => ({
              id: `${item.slug}-${item.sizeId}`,
              quantity: item.quantity,
              ...(typeof item.unitPrice === "number"
                ? {
                    item_price: saleAvailable
                      ? getDiscountedPrice(item.unitPrice)
                      : item.unitPrice,
                  }
                : {}),
            })),
            num_items: items.reduce((sum, item) => sum + item.quantity, 0),
            order_id: orderReference,
          },
          { eventId: `purchase-${orderReference}` },
        );
      }
      setReference(orderReference);
      setSubmitted(true);
      clearCart();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "حصلت مشكلة في تسجيل الطلب.",
      );
    } finally {
      setLoading(false);
    }
  }

  const noPaymentMethod = !paymentOptions.cod && !kashierAvailable;

  return (
    <form className="commerce-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <p className="section-heading__kicker">بيانات التواصل والتوصيل</p>
        <h2>خلّينا نعرف نوصل لك.</h2>
        <div className="form-grid">
          <label>
            <span>الاسم بالكامل</span>
            <input required name="name" autoComplete="name" />
          </label>
          <label>
            <span>رقم الموبايل</span>
            <input
              required
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
            />
          </label>
          <label>
            <span>البريد الإلكتروني</span>
            <input required name="email" type="email" autoComplete="email" />
          </label>
          <label>
            <span>المحافظة</span>
            <select
              required
              name="governorateId"
              value={governorateId}
              autoComplete="address-level1"
              onChange={(event) => {
                setGovernorateId(event.target.value);
                setCityId("");
              }}
            >
              <option value="">اختار المحافظة</option>
              {shippingLocations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nameAr}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>المدينة أو المنطقة</span>
            <select
              required
              name="cityId"
              value={cityId}
              autoComplete="address-level2"
              disabled={!governorateId}
              onChange={(event) => setCityId(event.target.value)}
            >
              <option value="">
                {governorateId
                  ? "اختار المدينة أو المنطقة"
                  : "اختار المحافظة أولًا"}
              </option>
              {activeCities.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nameAr}
                </option>
              ))}
            </select>
          </label>
          <label className="form-grid__full">
            <span>العنوان بالتفصيل</span>
            <textarea
              required
              name="address"
              rows={4}
              autoComplete="street-address"
            />
          </label>
        </div>
      </div>

      <div className="form-section">
        <p className="section-heading__kicker">تأكيد الطلب</p>
        <h2>{items.length} منتجات مختارة.</h2>
        <ul className="order-review">
          {items.map((item) => (
            <li key={item.key}>
              <span>
                <b dir="ltr">{item.name}</b>
                <small>
                  {item.sizeLabel} × {item.quantity}
                </small>
              </span>
              <span>
                {typeof item.unitPrice === "number"
                  ? money(
                      (saleAvailable
                        ? getDiscountedPrice(item.unitPrice)
                        : item.unitPrice) * item.quantity,
                    )
                  : "السعر قيد التأكيد"}
              </span>
            </li>
          ))}
        </ul>

        <dl className="checkout-totals">
          <div>
            <dt>إجمالي المنتجات قبل الخصم</dt>
            <dd>
              {listSubtotal === null ? "قيد التأكيد" : money(listSubtotal)}
            </dd>
          </div>
          {saleAvailable ? (
            <div className="checkout-totals__discount">
              <dt>خصم ({saleCampaign.discountPercent}%)</dt>
              <dd>
                {listSubtotal === null
                  ? "يُطبّق بعد التأكيد"
                  : `− ${money(discount)}`}
              </dd>
            </div>
          ) : null}
          <div>
            <dt>المنتجات بعد الخصم</dt>
            <dd>{subtotal === null ? "قيد التأكيد" : money(subtotal)}</dd>
          </div>
          <div>
            <dt>الشحن</dt>
            <dd>
              {!city
                ? "اختار عنوان التوصيل"
                : shippingAmount === null
                  ? "قيد التأكيد"
                  : money(shippingAmount)}
            </dd>
          </div>
          <div>
            <dt>الإجمالي</dt>
            <dd>{total === null ? "قيد التأكيد" : money(total)}</dd>
          </div>
        </dl>

        <fieldset className="payment-methods">
          <legend>طريقة الدفع</legend>
          {paymentOptions.cod ? (
            <label
              className={effectivePaymentMethod === "cod" ? "is-selected" : ""}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={effectivePaymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
              />
              <span>
                <b>الدفع عند الاستلام</b>
                <small>
                  لو أي سعر لسه غير محدد، الفريق هيأكد الإجمالي معاك قبل
                  التنفيذ.
                </small>
              </span>
            </label>
          ) : null}
          {paymentOptions.kashier ? (
            <label
              className={
                effectivePaymentMethod === "kashier" ? "is-selected" : ""
              }
            >
              <input
                type="radio"
                name="paymentMethod"
                value="kashier"
                checked={effectivePaymentMethod === "kashier"}
                disabled={!kashierAvailable}
                onChange={() => setPaymentMethod("kashier")}
              />
              <span>
                <b>الدفع الإلكتروني</b>
                <small>
                  {kashierAvailable
                    ? "هتنتقل لصفحة كاشير الآمنة لإتمام الدفع."
                    : "يتاح بعد اختيار العنوان وتحديد أسعار المنتجات والشحن."}
                </small>
              </span>
            </label>
          ) : null}
        </fieldset>

        {noPaymentMethod ? (
          <p className="form-error" role="alert">
            لا توجد طريقة دفع متاحة لهذا الطلب حاليًا.
          </p>
        ) : null}
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <button
          className="fit-button-primary"
          type="submit"
          disabled={loading || noPaymentMethod}
        >
          {loading
            ? "جاري تسجيل الطلب…"
            : effectivePaymentMethod === "kashier"
              ? "تابع للدفع الآمن"
              : "سجل الطلب"}
        </button>
      </div>
    </form>
  );
}
