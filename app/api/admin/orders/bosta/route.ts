import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  BostaIntegrationError,
  createBostaDelivery,
  orderStatusForBostaState,
  syncBostaDelivery,
} from "@/lib/bosta";
import { findOrder, updateOrder } from "@/lib/order-store";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      reference?: unknown;
      action?: unknown;
    };
    if (typeof body.reference !== "string" || !body.reference.trim()) {
      return NextResponse.json({ error: "رقم الطلب غير صالح." }, { status: 400 });
    }
    if (body.action !== "create" && body.action !== "sync") {
      return NextResponse.json({ error: "إجراء بوسطة غير صالح." }, { status: 400 });
    }

    const order = await findOrder(body.reference.trim());
    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود." }, { status: 404 });
    }

    const bosta =
      body.action === "create"
        ? await createBostaDelivery(order)
        : order.bosta
          ? await syncBostaDelivery(order.bosta)
          : null;
    if (!bosta) {
      return NextResponse.json(
        { error: "أنشئ شحنة بوسطة للطلب أولًا." },
        { status: 400 },
      );
    }

    const updated = await updateOrder(order.reference, {
      bosta,
      orderStatus: orderStatusForBostaState(
        bosta.stateCode,
        order.orderStatus,
      ),
      ...(bosta.stateCode === 45 && order.paymentMethod === "cod"
        ? { paymentStatus: "paid" as const }
        : {}),
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof BostaIntegrationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("[POST /api/admin/orders/bosta]", error);
    return NextResponse.json(
      { error: "تعذر تنفيذ طلب بوسطة حاليًا." },
      { status: 500 },
    );
  }
}
