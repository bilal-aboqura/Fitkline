import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { sendMetaOrderCancelled } from "@/lib/meta-conversions";
import {
  findOrder,
  getOrders,
  updateOrder,
  type OrderStatus,
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
  if (body.orderStatus === undefined && body.notes === undefined) {
    return NextResponse.json(
      { error: "لا توجد بيانات لتحديثها." },
      { status: 400 },
    );
  }
  const currentOrder = await findOrder(body.reference);
  if (!currentOrder) {
    return NextResponse.json({ error: "الطلب غير موجود." }, { status: 404 });
  }
  const order = await updateOrder(currentOrder.reference, {
    orderStatus:
      typeof body.orderStatus === "string"
        ? (body.orderStatus as OrderStatus)
        : undefined,
    notes: typeof body.notes === "string" ? body.notes.trim() : undefined,
  });
  if (!order) return NextResponse.json({ error: "الطلب غير موجود." }, { status: 404 });
  if (currentOrder.orderStatus !== "cancelled" && order.orderStatus === "cancelled") {
    await sendMetaOrderCancelled(order);
  }
  return NextResponse.json({ data: order });
}
