"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/commerce/cart-provider";

export function CheckoutForm({
  paymentOptions,
}: {
  paymentOptions: { cod: boolean; kashier: boolean };
}) {
  const { items, clearCart } = useCart();
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "kashier">(
    paymentOptions.cod ? "cod" : "kashier",
  );
  const [loading, setLoading] = useState(false);
  const kashierAvailable =
    paymentOptions.kashier &&
    items.every((item) => typeof item.unitPrice === "number" && item.unitPrice > 0);

  if (submitted) {
    return (
      <div className="success-state" role="status">
        <span className="empty-state__code" dir="ltr">REQUEST / {reference}</span>
        <h2>طلبك وصل لفريق Fitkline.</h2>
        <p>هنراجع المنتجات والأحجام ونتواصل معاك لتأكيد السعر، التوفر، والشحن قبل التنفيذ.</p>
        <Link className="fit-button-primary" href="/products">ارجع للمنتجات</Link>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="empty-state">
        <h2>مفيش منتجات للتأكيد.</h2>
        <p>ابدأ بإضافة منتج واحد على الأقل لطلبك.</p>
        <Link className="fit-button-primary" href="/products">تصفح المنتجات</Link>
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
          governorate: formData.get("governorate"),
          address: formData.get("address"),
          items,
          paymentMethod,
        }),
      });
      const result = (await response.json()) as {
        reference?: string;
        redirectUrl?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "حصلت مشكلة في إرسال الطلب.");
      if (result.redirectUrl) {
        window.location.assign(result.redirectUrl);
        return;
      }
      setReference(result.reference ?? "FTK-REQUEST");
      setSubmitted(true);
      clearCart();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "حصلت مشكلة في إرسال الطلب.",
      );
    } finally {
      setLoading(false);
    }
  }

  const noPaymentMethod = !paymentOptions.cod && !kashierAvailable;

  return (
    <form className="commerce-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <p className="section-heading__kicker">بيانات التواصل</p>
        <h2>خلّينا نعرف نوصل لك.</h2>
        <div className="form-grid">
          <label><span>الاسم بالكامل</span><input required name="name" autoComplete="name" /></label>
          <label><span>رقم الموبايل</span><input required name="phone" type="tel" inputMode="tel" autoComplete="tel" /></label>
          <label><span>البريد الإلكتروني</span><input required name="email" type="email" autoComplete="email" /></label>
          <label><span>المحافظة</span><input required name="governorate" autoComplete="address-level1" /></label>
          <label className="form-grid__full"><span>العنوان أو وصف المكان</span><textarea required name="address" rows={4} autoComplete="street-address" /></label>
        </div>
      </div>

      <div className="form-section">
        <p className="section-heading__kicker">تأكيد الطلب</p>
        <h2>{items.length} منتجات مختارة.</h2>
        <ul className="order-review">
          {items.map((item) => (
            <li key={item.key}>
              <span dir="ltr">{item.name}</span>
              <span>{item.sizeLabel} × {item.quantity}</span>
            </li>
          ))}
        </ul>

        <fieldset className="payment-methods">
          <legend>طريقة الدفع</legend>
          {paymentOptions.cod ? (
            <label className={paymentMethod === "cod" ? "is-selected" : ""}>
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
              />
              <span><b>الدفع عند الاستلام</b><small>فريق Fitkline يؤكد السعر والشحن قبل التنفيذ.</small></span>
            </label>
          ) : null}
          {kashierAvailable ? (
            <label className={paymentMethod === "kashier" ? "is-selected" : ""}>
              <input
                type="radio"
                name="paymentMethod"
                value="kashier"
                checked={paymentMethod === "kashier"}
                onChange={() => setPaymentMethod("kashier")}
              />
              <span><b>الدفع الإلكتروني مع كاشير</b><small>هتنتقل لصفحة كاشير الآمنة. Fitkline لا يستقبل بيانات بطاقتك.</small></span>
            </label>
          ) : null}
          {paymentOptions.kashier && !kashierAvailable ? (
            <p className="payment-methods__unavailable">
              كاشير يظهر بعد إضافة أسعار الأحجام المختارة من لوحة التحكم، ثم إعادة إضافتها للسلة.
            </p>
          ) : null}
        </fieldset>

        {noPaymentMethod ? (
          <p className="form-error" role="alert">لا توجد طريقة دفع مفعّلة حاليًا. تواصل مع فريق Fitkline.</p>
        ) : (
          <p className="form-notice">
            {paymentMethod === "kashier"
              ? "الدفع الإلكتروني يتاح فقط للمنتجات ذات السعر المؤكد."
              : "السعر، التوفر، وتكلفة الشحن يتم تأكيدهم معاك قبل التنفيذ."}
          </p>
        )}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="fit-button-primary" type="submit" disabled={loading || noPaymentMethod}>
          {loading
            ? "جاري تسجيل الطلب…"
            : paymentMethod === "kashier"
              ? "تابع للدفع الآمن"
              : "ابعت طلب التأكيد"}
        </button>
      </div>
    </form>
  );
}
