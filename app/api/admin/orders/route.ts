import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { sendMetaOrderCancelled } from "@/lib/meta-conversions";
import {
  findOrder,
  getOrders,
  updateOrder,
  type OrderStatus,
  type StoredOrder,
} from "@/lib/order-store";

const statuses = new Set<OrderStatus>([
  "new",
  "confirmed",
  "processing",
  "shipped",
  "completed",
  "cancelled",
]);

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  }
  return NextResponse.json({ data: await getOrders() });
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  }
  const body = (await request.json()) as {
    reference?: unknown;
    orderStatus?: unknown;
    notes?: unknown;
    items?: unknown;
    shippingAmount?: unknown;
  };
  if (typeof body.reference !== "string" || !body.reference.trim()) {
    return NextResponse.json({ error: "رقم الطلب غير صالح." }, { status: 400 });
  }
  if (
    body.orderStatus !== undefined &&
    (typeof body.orderStatus !== "string" ||
      !statuses.has(body.orderStatus as OrderStatus))
  ) {
    return NextResponse.json(
      { error: "بيانات الحالة غير صالحة." },
      { status: 400 },
    );
  }
  if (body.notes !== undefined && typeof body.notes !== "string") {
    return NextResponse.json(
      { error: "الملاحظة غير صالحة." },
      { status: 400 },
    );
  }
  if (typeof body.notes === "string" && body.notes.length > 2000) {
    return NextResponse.json(
      { error: "الملاحظة يجب ألا تزيد عن 2000 حرف." },
      { status: 400 },
    );
  }
  if (body.shippingAmount !== undefined &&
    (typeof body.shippingAmount !== "number" ||
      !Number.isFinite(body.shippingAmount) || body.shippingAmount < 0)) {
    return NextResponse.json(
      { error: "سعر الشحن يجب أن يكون رقمًا غير سالب." },
      { status: 400 },
    );
  }
  if (body.items !== undefined && !Array.isArray(body.items)) {
    return NextResponse.json({ error: "بيانات المنتجات غير صالحة." }, { status: 400 });
  }
  if (body.orderStatus === undefined && body.notes === undefined && body.items === undefined && body.shippingAmount === undefined) {
    return NextResponse.json(
      { error: "لا توجد بيانات لتحديثها." },
      { status: 400 },
    );
  }
  const currentOrder = await findOrder(body.reference);
  if (!currentOrder) {
    return NextResponse.json({ error: "الطلب غير موجود." }, { status: 404 });
  }
  let items: StoredOrder["items"] | undefined;
  let subtotal: number | null | undefined;
  let shippingAmount: number | null | undefined;
  let total: number | null | undefined;
  if (body.items !== undefined) {
    if (body.items.length === 0) {
      return NextResponse.json({ error: "يجب أن يحتوي الطلب على منتج واحد على الأقل." }, { status: 400 });
    }
    const parsedItems = body.items.map((item): StoredOrder["items"][number] | null => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as Record<string, unknown>;
      const sizeId = candidate.sizeId;
      const unitPrice = candidate.unitPrice;
      const validSize = sizeId === "4kg" || sizeId === "20kg";
      const validPrice = unitPrice === null ||
        (typeof unitPrice === "number" && Number.isFinite(unitPrice) && unitPrice >= 0);
      if (
        typeof candidate.slug !== "string" || !candidate.slug.trim() ||
        typeof candidate.name !== "string" || !candidate.name.trim() ||
        !validSize || typeof candidate.sizeLabel !== "string" || !candidate.sizeLabel.trim() ||
        typeof candidate.quantity !== "number" || !Number.isInteger(candidate.quantity) || candidate.quantity < 1 ||
        !validPrice
      ) return null;
      return {
        slug: candidate.slug.trim(),
        name: candidate.name.trim(),
        sizeId,
        sizeLabel: candidate.sizeLabel.trim(),
        quantity: candidate.quantity,
        unitPrice,
        ...(typeof candidate.listUnitPrice === "number" && Number.isFinite(candidate.listUnitPrice) && candidate.listUnitPrice >= 0
          ? { listUnitPrice: candidate.listUnitPrice }
          : {}),
        ...(typeof candidate.discountPercent === "number" && Number.isFinite(candidate.discountPercent) && candidate.discountPercent >= 0 && candidate.discountPercent <= 100
          ? { discountPercent: candidate.discountPercent }
          : {}),
      };
    });
    if (parsedItems.some((item) => item === null)) {
      return NextResponse.json({ error: "تحقق من اسم المنتج، الحجم، الكمية والسعر." }, { status: 400 });
    }
    const safeItems = parsedItems as StoredOrder["items"];
    items = safeItems;
    const calculatedSubtotal = safeItems.reduce<number | null>(
      (sum, item) => sum === null || item.unitPrice === null ? null : sum + item.unitPrice * item.quantity,
      0,
    );
    subtotal = calculatedSubtotal === null
      ? null
      : Math.round(calculatedSubtotal * 100) / 100;
  }
  if (body.shippingAmount !== undefined) shippingAmount = body.shippingAmount;
  const finalSubtotal = subtotal ?? currentOrder.subtotal;
  const finalShipping = shippingAmount ?? currentOrder.shippingAmount;
  if (body.items !== undefined || body.shippingAmount !== undefined) {
    total = finalSubtotal === null || finalShipping === null
      ? null
      : Math.round((finalSubtotal + finalShipping) * 100) / 100;
  }
  const order = await updateOrder(currentOrder.reference, {
    orderStatus:
      typeof body.orderStatus === "string"
        ? (body.orderStatus as OrderStatus)
        : undefined,
    notes: typeof body.notes === "string" ? body.notes.trim() : undefined,
    items,
    subtotal,
    shippingAmount,
    total,
  });
  if (!order) return NextResponse.json({ error: "الطلب غير موجود." }, { status: 404 });
  if (currentOrder.orderStatus !== "cancelled" && order.orderStatus === "cancelled") {
    await sendMetaOrderCancelled(order);
  }
  return NextResponse.json({ data: order });
}
