import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getCmsContent } from "@/lib/cms-store";
import { createKashierSession, getKashierConfiguration } from "@/lib/kashier";
import { getSiteOrigin } from "@/lib/site-url";
import { resolveShippingLocation } from "@/lib/shipping-store";
import { isCustomerEligibleForSale } from "@/lib/campaign-store";
import { notifyTelegramAboutNewOrder } from "@/lib/telegram";
import {
  getDiscountedPrice,
} from "@/data/campaign";
import { getValidBundleOffers, getLinePrice } from "@/lib/cart-pricing";
import { phoneComparisonKey } from "@/lib/phone";
import { getCustomerLoyalty } from "@/lib/customer-loyalty-store";
import { isEgyptianMobile } from "@/lib/customer-loyalty";
import {
  createOrder,
  updateOrder,
  type PaymentMethod,
  type StoredOrder,
} from "@/lib/order-store";

type SubmittedItem = {
  slug?: unknown;
  sizeId?: unknown;
  quantity?: unknown;
  offerId?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const customer = {
      name: text(body.name),
      phone: text(body.phone),
      alternatePhone: text(body.alternatePhone),
      email: text(body.email),
      address: text(body.address),
    };
    const missing = Object.entries(customer)
      .filter(([, value]) => !value)
      .map(([field]) => field);
    if (missing.length) {
      return NextResponse.json(
        { error: "من فضلك كمّل بيانات التواصل والعنوان.", missing },
        { status: 400 },
      );
    }
    if (!isEgyptianMobile(customer.phone) || !isEgyptianMobile(customer.alternatePhone)) {
      return NextResponse.json({ error: "اكتب رقم موبايل مصري صحيح للرقم الأساسي والبديل." }, { status: 400 });
    }
    customer.phone = `0${phoneComparisonKey(customer.phone)}`;
    customer.alternatePhone = `0${phoneComparisonKey(customer.alternatePhone)}`;
    if (
      phoneComparisonKey(customer.phone) ===
      phoneComparisonKey(customer.alternatePhone)
    ) {
      return NextResponse.json(
        { error: "لازم رقم الموبايل البديل يكون مختلف عن الرقم الأساسي." },
        { status: 400 },
      );
    }

    const governorateId = text(body.governorateId);
    const cityId = Number(body.cityId);
    const shippingLocation =
      governorateId && Number.isInteger(cityId)
        ? await resolveShippingLocation(governorateId, cityId)
        : null;
    if (!shippingLocation) {
      return NextResponse.json(
        { error: "اختار محافظة ومدينة متاحتين للتوصيل." },
        { status: 400 },
      );
    }

    const rawItems = Array.isArray(body.items) ? (body.items as SubmittedItem[]) : [];
    if (!rawItems.length) {
      return NextResponse.json({ error: "أضف منتجًا واحدًا على الأقل." }, { status: 400 });
    }

    const content = await getCmsContent();
    const validOffers = getValidBundleOffers(rawItems, content.offers, content.products);
    const requestedMethod = text(body.paymentMethod);
    const paymentMethod: PaymentMethod =
      requestedMethod === "kashier" ? "kashier" : "cod";
    if (paymentMethod === "cod" && !content.settings.cashOnDeliveryEnabled) {
      return NextResponse.json(
        { error: "الدفع عند الاستلام غير متاح حاليًا." },
        { status: 400 },
      );
    }
    if (paymentMethod === "kashier" && !content.settings.kashierEnabled) {
      return NextResponse.json(
        { error: "الدفع الإلكتروني غير متاح حاليًا." },
        { status: 400 },
      );
    }
    const saleEligible = await isCustomerEligibleForSale(customer.phone);
    const items: StoredOrder["items"] = [];
    let subtotal = 0;
    let hasPendingPrice = false;

    for (const rawItem of rawItems) {
      const slug = text(rawItem.slug);
      const sizeId = text(rawItem.sizeId);
      const quantity = Math.max(1, Math.min(99, Number(rawItem.quantity) || 1));
      const product = content.products.find((candidate) => candidate.slug === slug && candidate.active);
      const size = product?.sizes.find((candidate) => candidate.id === sizeId && candidate.active);
      if (!product || !size) {
        return NextResponse.json(
          { error: "أحد المنتجات أو الأحجام لم يعد متاحًا. راجع السلة." },
          { status: 400 },
        );
      }
      if (size.stock !== null && size.stock < quantity) {
        return NextResponse.json(
          { error: `الكمية المطلوبة من ${product.name} ${size.label} غير متاحة حاليًا.` },
          { status: 400 },
        );
      }
      const offerId = text(rawItem.offerId);
      const offerPricing = offerId ? validOffers.get(offerId) : undefined;
      const listAfterOffer = getLinePrice(size, quantity, offerPricing);
      const unitPrice =
        listAfterOffer === null
          ? null
          : saleEligible
            ? getDiscountedPrice(listAfterOffer, paymentMethod)
            : listAfterOffer;
      if (unitPrice === null) hasPendingPrice = true;
      else subtotal += unitPrice * quantity;
      items.push({
        slug: product.slug,
        name: product.name,
        sizeId: size.id,
        sizeLabel: size.label,
        quantity,
        unitPrice,
        ...(size.price !== null && unitPrice !== null && unitPrice < size.price
          ? {
              discountPercent: Math.round((1 - unitPrice / size.price) * 10000) / 100,
              ...(size.price !== null ? { listUnitPrice: size.price } : {}),
            }
          : {}),
      });
    }

    const kashier = getKashierConfiguration();
    const confirmedSubtotal = hasPendingPrice ? null : subtotal;
    if (Object.hasOwn(body, "expectedSubtotal") && (
      (body.expectedSubtotal === null) !== (confirmedSubtotal === null) ||
      (confirmedSubtotal !== null && (typeof body.expectedSubtotal !== "number" || Math.abs(body.expectedSubtotal - confirmedSubtotal) >= 0.005))
    )) {
      return NextResponse.json({ error: "أسعار السلة اتغيرت. حدّث الصفحة وراجع الإجمالي قبل تأكيد الطلب." }, { status: 409 });
    }
    const shippingAmount = shippingLocation.shippingPrice;
    const total =
      !hasPendingPrice && shippingAmount !== null
        ? subtotal + shippingAmount
        : null;
    // Recheck on the server; a browser-provided customer tier cannot waive payment.
    const loyalty = paymentMethod === "cod"
      ? await getCustomerLoyalty(customer.phone)
      : { eligible: false, deliveredOrders: 0, score: 0 };
    const requiresShippingPrepayment = paymentMethod === "cod" && !loyalty.eligible;
    if (requiresShippingPrepayment && shippingAmount === null) {
      return NextResponse.json({ error: "لازم يتحدد سعر الشحن قبل دفعه أونلاين. تواصل مع الفريق." }, { status: 400 });
    }
    const onlineAmount = paymentMethod === "kashier" ? total : requiresShippingPrepayment ? shippingAmount : 0;
    if ((onlineAmount ?? 0) > 0 && (!content.settings.kashierEnabled || !kashier.ready)) {
      return NextResponse.json({ error: "دفع الشحن أونلاين غير متاح حاليًا. حاول لاحقًا أو تواصل مع الفريق." }, { status: 400 });
    }
    if (paymentMethod === "kashier") {
      if (!content.settings.kashierEnabled || !kashier.ready) {
        return NextResponse.json({ error: "الدفع الإلكتروني غير متاح حاليًا." }, { status: 400 });
      }
      if (total === null || total <= 0) {
        return NextResponse.json(
          {
            error:
              "الدفع الإلكتروني يحتاج سعرًا مؤكدًا للمنتجات والشحن.",
          },
          { status: 400 },
        );
      }
    }

    const reference = `FTK-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    const order: StoredOrder = {
      id: crypto.randomUUID(),
      reference,
      createdAt: now,
      updatedAt: now,
      customer: {
        ...customer,
        governorate: shippingLocation.governorate.nameAr,
        governorateId: shippingLocation.governorate.id,
        city: shippingLocation.city.nameAr,
        cityId: shippingLocation.city.id,
      },
      items,
      subtotal: hasPendingPrice ? null : subtotal,
      shippingAmount,
      total,
      currency: "EGP",
      orderStatus: "new",
      paymentMethod,
      paymentStatus: (onlineAmount ?? 0) > 0 ? "pending" : "not-required",
      paymentPlan: {
        onlineAmount: onlineAmount ?? 0,
        fitklineCustomer: loyalty.eligible,
        deliveredOrders: loyalty.deliveredOrders,
        score: loyalty.score,
      },
    };
    await createOrder(order);
    try {
      await notifyTelegramAboutNewOrder(order);
    } catch (error) {
      console.error(
        `[telegram] Failed to notify about ${reference}:`,
        error instanceof Error ? error.message : "Unknown error",
      );
    }

    if ((onlineAmount ?? 0) > 0) {
      try {
        const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL
          ? getSiteOrigin()
          : new URL(request.url).origin;
        const session = await createKashierSession({
          reference,
          amount: onlineAmount!,
          customerEmail: customer.email,
          customerReference: customer.phone,
          origin: configuredOrigin,
        });
        await updateOrder(reference, { kashierSessionId: session.sessionId });
        return NextResponse.json(
          { received: true, reference, redirectUrl: session.sessionUrl },
          { status: 201 },
        );
      } catch (error) {
        await updateOrder(reference, {
          paymentStatus: "failed",
          notes: error instanceof Error ? error.message : "Kashier session failed",
        });
        return NextResponse.json(
          { error: "تعذر فتح صفحة الدفع. الطلب محفوظ ولم يُؤكد الدفع؛ تواصل مع الفريق برقم الطلب.", reference },
          { status: 502 },
        );
      }
    }

    return NextResponse.json({ received: true, reference }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/order]", error);
    return NextResponse.json(
      { error: "حصلت مشكلة عند تسجيل الطلب. حاول مرة أخرى." },
      { status: 500 },
    );
  }
}
