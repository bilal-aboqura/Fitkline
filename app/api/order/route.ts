import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getCmsContent } from "@/lib/cms-store";
import { createKashierSession, getKashierConfiguration } from "@/lib/kashier";
import { getSiteOrigin } from "@/lib/site-url";
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
      email: text(body.email),
      governorate: text(body.governorate),
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

    const rawItems = Array.isArray(body.items) ? (body.items as SubmittedItem[]) : [];
    if (!rawItems.length) {
      return NextResponse.json({ error: "أضف منتجًا واحدًا على الأقل." }, { status: 400 });
    }

    const content = await getCmsContent();
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
      if (size.price === null) hasPendingPrice = true;
      else subtotal += size.price * quantity;
      items.push({
        slug: product.slug,
        name: product.name,
        sizeId: size.id,
        sizeLabel: size.label,
        quantity,
        unitPrice: size.price,
      });
    }

    const requestedMethod = text(body.paymentMethod);
    const paymentMethod: PaymentMethod = requestedMethod === "kashier" ? "kashier" : "cod";
    if (paymentMethod === "cod" && !content.settings.cashOnDeliveryEnabled) {
      return NextResponse.json({ error: "الدفع عند الاستلام غير متاح حاليًا." }, { status: 400 });
    }

    const kashier = getKashierConfiguration();
    if (paymentMethod === "kashier") {
      if (!content.settings.kashierEnabled || !kashier.ready) {
        return NextResponse.json({ error: "الدفع الإلكتروني غير متاح حاليًا." }, { status: 400 });
      }
      if (hasPendingPrice || subtotal <= 0) {
        return NextResponse.json(
          { error: "الدفع الإلكتروني يحتاج سعرًا مؤكدًا لكل حجم في الطلب." },
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
      customer,
      items,
      subtotal: hasPendingPrice ? null : subtotal,
      currency: "EGP",
      orderStatus: "new",
      paymentMethod,
      paymentStatus: paymentMethod === "kashier" ? "pending" : "not-required",
    };
    await createOrder(order);

    if (paymentMethod === "kashier") {
      try {
        const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL
          ? getSiteOrigin()
          : new URL(request.url).origin;
        const session = await createKashierSession({
          reference,
          amount: subtotal,
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
          { error: "تعذر فتح جلسة كاشير. الطلب اتسجل ويمكنك اختيار الدفع عند الاستلام.", reference },
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
