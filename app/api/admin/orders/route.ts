import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getOrders, updateOrder, type OrderStatus } from "@/lib/order-store";

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
  if (
    typeof body.reference !== "string" ||
    typeof body.orderStatus !== "string" ||
    !statuses.has(body.orderStatus as OrderStatus)
  ) {
    return NextResponse.json({ error: "بيانات الحالة غير صالحة." }, { status: 400 });
  }
  const order = await updateOrder(body.reference, {
    orderStatus: body.orderStatus as OrderStatus,
    notes: typeof body.notes === "string" ? body.notes : undefined,
  });
  if (!order) return NextResponse.json({ error: "الطلب غير موجود." }, { status: 404 });
  return NextResponse.json({ data: order });
}

