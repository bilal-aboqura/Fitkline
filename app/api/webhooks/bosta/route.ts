import crypto from "node:crypto";
import { NextResponse } from "next/server";
import {
  BOSTA_WEBHOOK_HEADER,
  getBostaConfiguration,
  orderStatusForBostaState,
  shipmentFromWebhook,
  syncBostaDelivery,
  type BostaWebhookPayload,
} from "@/lib/bosta";
import {
  findOrder,
  findOrderByBostaTrackingNumber,
  updateOrder,
} from "@/lib/order-store";

function secureEqual(received: string, expected: string) {
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  const configuration = getBostaConfiguration();
  const receivedSecret = request.headers.get(BOSTA_WEBHOOK_HEADER) ?? "";
  if (
    !configuration.webhookSecret ||
    !secureEqual(receivedSecret, configuration.webhookSecret)
  ) {
    return NextResponse.json({ received: false }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 64 * 1024) {
    return NextResponse.json({ received: false }, { status: 413 });
  }

  try {
    const payload = (await request.json()) as BostaWebhookPayload;
    const stateCode = Number(payload.state);
    const reference =
      typeof payload.businessReference === "string"
        ? payload.businessReference.trim()
        : "";
    const trackingNumber =
      typeof payload.trackingNumber === "string" ||
      typeof payload.trackingNumber === "number"
        ? String(payload.trackingNumber)
        : "";
    if (!Number.isInteger(stateCode) || (!reference && !trackingNumber)) {
      return NextResponse.json({ received: false }, { status: 400 });
    }

    const order =
      (reference ? await findOrder(reference) : null) ??
      (trackingNumber
        ? await findOrderByBostaTrackingNumber(trackingNumber)
        : null);
    if (!order) {
      return NextResponse.json({ received: true, matched: false }, { status: 202 });
    }

    const webhookShipment = shipmentFromWebhook(payload, order.bosta);
    const bosta = await syncBostaDelivery(webhookShipment).catch(
      () => webhookShipment,
    );
    if (!bosta.deliveryId || !bosta.trackingNumber) {
      return NextResponse.json({ received: false }, { status: 400 });
    }
    if (
      order.bosta?.stateUpdatedAt &&
      new Date(bosta.stateUpdatedAt).getTime() <
        new Date(order.bosta.stateUpdatedAt).getTime()
    ) {
      return NextResponse.json({ received: true, stale: true });
    }

    await updateOrder(order.reference, {
      bosta,
      orderStatus: orderStatusForBostaState(stateCode, order.orderStatus),
      ...(stateCode === 45 && order.paymentMethod === "cod"
        ? { paymentStatus: "paid" as const }
        : {}),
    });
    return NextResponse.json({ received: true, matched: true });
  } catch (error) {
    console.error("[POST /api/webhooks/bosta]", error);
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
