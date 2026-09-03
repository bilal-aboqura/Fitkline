import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { sendMetaOrderCancelled } from "@/lib/meta-conversions";
import { createMylerzShipment, MylerzIntegrationError, orderStatusForMylerzStatus, syncMylerzShipment } from "@/lib/mylerz";
import { findOrder, updateOrder } from "@/lib/order-store";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  try {
    const body = (await request.json()) as { reference?: unknown; action?: unknown };
    if (typeof body.reference !== "string" || !body.reference.trim()) return NextResponse.json({ error: "رقم الطلب غير صالح." }, { status: 400 });
    if (body.action !== "create" && body.action !== "sync") return NextResponse.json({ error: "إجراء Mylerz غير صالح." }, { status: 400 });
    const order = await findOrder(body.reference.trim());
    if (!order) return NextResponse.json({ error: "الطلب غير موجود." }, { status: 404 });
    const mylerz = body.action === "create"
      ? await createMylerzShipment(order)
      : order.mylerz ? await syncMylerzShipment(order.mylerz) : null;
    if (!mylerz) return NextResponse.json({ error: "أنشئ شحنة Mylerz للطلب أولًا." }, { status: 400 });
    const updated = await updateOrder(order.reference, {
      mylerz,
      orderStatus: orderStatusForMylerzStatus(mylerz.status, order.orderStatus),
      ...(mylerz.status.toLowerCase().includes("deliver") && order.paymentMethod === "cod" ? { paymentStatus: "paid" as const } : {}),
    });
    if (order.orderStatus !== "cancelled" && updated?.orderStatus === "cancelled") {
      await sendMetaOrderCancelled(updated);
    }
    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof MylerzIntegrationError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[POST /api/admin/orders/mylerz]", error);
    return NextResponse.json({ error: "تعذر تنفيذ طلب Mylerz حاليًا." }, { status: 500 });
  }
}
