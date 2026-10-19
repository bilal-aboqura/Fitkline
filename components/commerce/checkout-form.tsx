"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  setMetaAdvancedMatching,
  trackMetaEvent,
} from "@/components/analytics/meta-events";
import { useCart } from "@/components/commerce/cart-provider";
import { useCampaign } from "@/components/commerce/campaign-provider";
import {
  getDiscountAmount,
  getDiscountedPrice,
  getPaymentDiscountPercent,
  isSaleAvailable,
  saleCampaign,
} from "@/data/campaign";
import type { ShippingGovernorate } from "@/lib/shipping-store";
import { phoneComparisonKey } from "@/lib/phone";
import { isEgyptianMobile } from "@/lib/customer-loyalty";

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
  const [phoneError, setPhoneError] = useState("");
  const [governorateId, setGovernorateId] = useState("");
  const [cityId, setCityId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "kashier">(
    paymentOptions.cod ? "cod" : "kashier",
  );
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [loyalty, setLoyalty] = useState<{ phone: string; eligible: boolean } | null>(null);
  const [loyaltyError, setLoyaltyError] = useState("");
  const [loyaltyRetry, setLoyaltyRetry] = useState(0);
  const initiatedCheckout = useRef(false);
  const phoneKey = phoneComparisonKey(phone);
  const loyaltyReady = loyalty?.phone === phoneKey;
  const fitklineCustomer = loyaltyReady && loyalty.eligible;

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
  const discountFor = (method: "cod" | "kashier") =>
    listSubtotal === null || !saleAvailable
      ? 0
      : items.reduce(
          (total, item) =>
            total +
            (typeof item.unitPrice === "number"
              ? getDiscountAmount(item.unitPrice, method) * item.quantity
              : 0),
          0,
        );
  const kashierDiscount = discountFor("kashier");
  const kashierSubtotal =
    listSubtotal === null ? null : listSubtotal - kashierDiscount;
  const kashierTotal =
    kashierSubtotal !== null && shippingAmount !== null
      ? kashierSubtotal + shippingAmount
      : null;
  const kashierAvailable =
    paymentOptions.kashier && kashierTotal !== null && kashierTotal > 0;
  const activeCities = governorate?.cities.filter((item) => item.active) ?? [];
  const effectivePaymentMethod =
    paymentMethod === "kashier" && !kashierAvailable && paymentOptions.cod
      ? "cod"
      : paymentMethod;
  const discountPercent = saleAvailable
    ? getPaymentDiscountPercent(effectivePaymentMethod)
    : 0;
  const discount = discountFor(effectivePaymentMethod);
  const subtotal = listSubtotal === null ? null : listSubtotal - discount;
  const total =
    subtotal !== null && shippingAmount !== null
      ? subtotal + shippingAmount
      : null;
  const shippingPrepayment = effectivePaymentMethod === "cod" && !fitklineCustomer;
  const onlineAmount = effectivePaymentMethod === "kashier" ? total : shippingPrepayment ? shippingAmount : 0;
  const dueOnDelivery = effectivePaymentMethod === "cod" ? fitklineCustomer ? total : subtotal : 0;
  const codUnavailable = effectivePaymentMethod === "cod" && (
    !loyaltyReady || (shippingPrepayment && (shippingAmount === null || (shippingAmount > 0 && !paymentOptions.kashier)))
  );

  useEffect(() => {
    if (!isEgyptianMobile(phoneKey)) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/checkout/customer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneKey }),
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
        });
        if (!response.ok) throw new Error("Loyalty lookup failed");
        const result = await response.json();
        if (!controller.signal.aborted) {
          setLoyalty({ phone: phoneKey, eligible: result.eligible === true });
          setLoyaltyError("");
        }
      } catch {
        if (!controller.signal.aborted) setLoyaltyError("تعذر التحقق من ميزة عميل Fitkline. حاول تاني.");
      }
    }, 400);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [phoneKey, loyaltyRetry]);

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
                ? getDiscountedPrice(item.unitPrice, effectivePaymentMethod)
                : item.unitPrice,
            }
          : {}),
      })),
      currency: "EGP",
      num_items: items.reduce((sum, item) => sum + item.quantity, 0),
      ...(subtotal !== null ? { value: subtotal } : {}),
    });
  }, [effectivePaymentMethod, items, saleAvailable, subtotal]);

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
    setPhoneError("");
    if (codUnavailable) {
      setError("استنى التحقق من رقمك واختار عنوان بشحن محدد قبل المتابعة.");
      return;
    }
    const formData = new FormData(event.currentTarget);
    const phone = formData.get("phone");
    const alternatePhone = formData.get("alternatePhone");
    if (
      phoneComparisonKey(phone) &&
      phoneComparisonKey(phone) === phoneComparisonKey(alternatePhone)
    ) {
      setPhoneError("لازم رقم الموبايل البديل يكون مختلف عن الرقم الأساسي.");
      const alternatePhoneInput = event.currentTarget.elements.namedItem(
        "alternatePhone",
      );
      if (alternatePhoneInput instanceof HTMLElement) alternatePhoneInput.focus();
      return;
    }
    setLoading(true);
    try {
      setMetaAdvancedMatching({
        email: formData.get("email"),
        phone,
      });
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          phone,
          alternatePhone,
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
        throw new Error(`${result.error ?? "حصلت مشكلة في تسجيل الطلب."}${result.reference ? ` رقم الطلب: ${result.reference}` : ""}`);
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
                      ? getDiscountedPrice(item.unitPrice, effectivePaymentMethod)
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
            <span>رقم الموبايل الأساسي</span>
            <input
              required
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              aria-describedby="fitkline-customer-status"
              onChange={(event) => {
                setPhone(event.target.value);
                setLoyaltyError("");
                if (phoneComparisonKey(event.target.value) !== phoneKey) setLoyalty(null);
                if (phoneError) setPhoneError("");
              }}
            />
          </label>
          <label>
            <span>رقم موبايل بديل</span>
            <input
              required
              name="alternatePhone"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              aria-invalid={phoneError ? true : undefined}
              aria-describedby={phoneError ? "alternate-phone-error" : undefined}
              onChange={() => {
                if (phoneError) setPhoneError("");
              }}
            />
            {phoneError ? (
              <small id="alternate-phone-error" className="form-error">
                {phoneError}
              </small>
            ) : null}
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
        <div id="fitkline-customer-status" className={`checkout-customer-status${fitklineCustomer ? " checkout-customer-status--member" : ""}`} role="status" aria-live="polite">
          {fitklineCustomer ? <><strong>أنت عميل Fitkline</strong><p>شكرًا لثقتك فينا. تقدر تدفع قيمة الطلب والشحن بالكامل عند الاستلام، من غير دفع شحن مقدم.</p></> :
            loyaltyError ? <><p>{loyaltyError}</p><button type="button" className="fit-button-secondary" onClick={() => { setLoyaltyError(""); setLoyaltyRetry((value) => value + 1); }}>حاول تاني</button></> :
            <p>{!isEgyptianMobile(phone) ? "اكتب رقم الموبايل الأساسي علشان نتحقق من ميزة عميل Fitkline." : !loyaltyReady ? "بنتحقق من ميزة عميل Fitkline…" : "مع الدفع عند الاستلام، بتدفع الشحن أونلاين والمنتجات وقت وصولها. عملاء Fitkline المؤهلون بيدفعوا الكل عند الاستلام."}</p>}
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
                        ? getDiscountedPrice(item.unitPrice, effectivePaymentMethod)
                        : item.unitPrice) * item.quantity,
                    )
                  : "السعر قيد التأكيد"}
              </span>
            </li>
          ))}
        </ul>

        {saleAvailable ? (
          <div className="payment-discount-notice payment-discount-notice--checkout" role="note">
            <b>وفّر أكتر مع طريقة الدفع المناسبة</b>
            <span>
              خصم {saleCampaign.discountPercent}% عند الاستلام، وخصم {saleCampaign.electronicDiscountPercent}% عند الدفع الإلكتروني. الإجمالي بيتحدّث تلقائيًا حسب اختيارك.
            </span>
          </div>
        ) : null}

        <dl className="checkout-totals" aria-live="polite">
          <div>
            <dt>إجمالي المنتجات قبل الخصم</dt>
            <dd>
              {listSubtotal === null ? "قيد التأكيد" : money(listSubtotal)}
            </dd>
          </div>
          {saleAvailable ? (
            <div className="checkout-totals__discount">
              <dt>
                خصم {effectivePaymentMethod === "kashier" ? "الدفع الإلكتروني" : "الدفع عند الاستلام"} ({discountPercent}%)
              </dt>
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
          <div>
            <dt>المطلوب أونلاين دلوقتي{shippingPrepayment ? " (الشحن فقط)" : ""}</dt>
            <dd>{effectivePaymentMethod === "cod" && !loyaltyReady ? "بعد التحقق من رقمك" : onlineAmount === null ? "قيد التأكيد" : money(onlineAmount)}</dd>
          </div>
          <div>
            <dt>عند الاستلام</dt>
            <dd>{effectivePaymentMethod === "cod" && !loyaltyReady ? "بعد التحقق من رقمك" : dueOnDelivery === null ? "قيد التأكيد" : money(dueOnDelivery)}</dd>
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
                <b>
                  الدفع عند الاستلام
                  {saleAvailable ? <em>خصم {saleCampaign.discountPercent}%</em> : null}
                </b>
                <small>
                  {fitklineCustomer ? "بصفتك عميل Fitkline، ادفع المنتجات والشحن عند الاستلام." : "ادفع الشحن فقط أونلاين عبر كاشير، وقيمة المنتجات عند الاستلام. دفع الشحن مقدمًا لا يغيّر خصم الدفع عند الاستلام."}
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
                <b>
                  الدفع الإلكتروني
                  {saleAvailable ? <em>خصم {saleCampaign.electronicDiscountPercent}% · أفضل توفير</em> : null}
                </b>
                <small>
                  {kashierAvailable
                    ? "هتنتقل لصفحة كاشير الآمنة لإتمام الدفع بالسعر بعد الخصم."
                    : "يتاح بعد اختيار العنوان وتحديد أسعار المنتجات والشحن."}
                </small>
              </span>
            </label>
          ) : null}
        </fieldset>
        {shippingPrepayment && loyaltyReady && city && (shippingAmount === null || (shippingAmount > 0 && !paymentOptions.kashier)) ? <p className="form-error" role="alert">{shippingAmount === null ? "سعر الشحن لعنوانك قيد التأكيد. تواصل مع الفريق لاستكمال الطلب." : "دفع الشحن أونلاين غير متاح حاليًا. حاول لاحقًا أو تواصل مع الفريق."}</p> : null}

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
          disabled={loading || noPaymentMethod || codUnavailable}
        >
          {loading
            ? "جاري تسجيل الطلب…"
            : effectivePaymentMethod === "cod" && !loyaltyReady
              ? loyaltyError ? "أعد التحقق من رقمك أولًا" : isEgyptianMobile(phone) ? "جاري التحقق من ميزة عميل Fitkline…" : "اكتب رقمك للتحقق أولًا"
            : shippingPrepayment && (onlineAmount ?? 0) > 0
              ? `ادفع الشحن ${money(onlineAmount!)} وأكمل الطلب`
            : effectivePaymentMethod === "kashier"
              ? "تابع للدفع الآمن"
              : "سجل الطلب"}
        </button>
      </div>
    </form>
  );
}
