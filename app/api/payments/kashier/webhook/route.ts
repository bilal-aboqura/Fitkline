import { NextResponse } from "next/server";
import { getOrders, updateOrder } from "@/lib/order-store";
import { inspectKashierPayment, verifyKashierSession } from "@/lib/kashier";

function findText(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (typeof payload[key] === "string") return payload[key] as string;
  }
  const data = payload.data;
  if (data && typeof data === "object") {
    for (const key of keys) {
      const value = (data as Record<string, unknown>)[key];
      if (typeof value === "string") return value;
    }
  }
  return "";
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const sessionId = findText(payload, ["sessionId", "session_id", "_id"]);
    if (!sessionId) {
      return NextResponse.json({ error: "Missing session id" }, { status: 400 });
    }

    const orders = await getOrders();
    const storedOrder = orders.find((order) => order.kashierSessionId === sessionId);
    if (!storedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const verified = await verifyKashierSession(sessionId);
    if (storedOrder.subtotal === null) {
      return NextResponse.json({ error: "Order amount unavailable" }, { status: 409 });
    }
    const inspection = inspectKashierPayment(verified, {
      sessionId,
      reference: storedOrder.reference,
      amount: storedOrder.subtotal,
      currency: storedOrder.currency,
    });
    if (!inspection.integrityValid) {
      return NextResponse.json({ error: "Payment integrity mismatch" }, { status: 409 });
    }
    await updateOrder(storedOrder.reference, {
      paymentStatus: inspection.paid
        ? "paid"
        : inspection.failed
          ? "failed"
          : "pending",
      kashierPaymentId: inspection.paymentId,
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Kashier webhook]", error);
    return NextResponse.json({ error: "Webhook verification failed" }, { status: 500 });
  }
}
