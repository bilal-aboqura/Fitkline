import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  MylerzIntegrationError,
  orderStatusForMylerzStatus,
  syncMylerzShipment,
} from "@/lib/mylerz";
import { getOrders, updateOrder } from "@/lib/order-store";
import { sendMetaOrderCancelled } from "@/lib/meta-conversions";

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  }

  try {
    const orders = (await getOrders()).filter((order) => order.mylerz);
    const updatedOrders = [];
    const failedReferences: string[] = [];

    // Keep the Mylerz API load controlled while allowing a useful bulk refresh.
    for (const order of orders) {
      try {
        const mylerz = await syncMylerzShipment(order.mylerz!);
        const updated = await updateOrder(order.reference, {
          mylerz,
          orderStatus: orderStatusForMylerzStatus(mylerz.status, order.orderStatus),
          ...(mylerz.status.toLowerCase().includes("deliver") && order.paymentMethod === "cod"
            ? { paymentStatus: "paid" as const }
            : {}),
        });
        if (!updated) {
          failedReferences.push(order.reference);
          continue;
        }
        if (order.orderStatus !== "cancelled" && updated.orderStatus === "cancelled") {
          await sendMetaOrderCancelled(updated);
        }
        updatedOrders.push(updated);
      } catch (error) {
        console.error(`[POST /api/admin/orders/mylerz/sync-all] ${order.reference}`, error);
        failedReferences.push(order.reference);
      }
    }

    return NextResponse.json({
      data: {
        found: orders.length,
        refreshed: updatedOrders.length,
        failedReferences,
        orders: updatedOrders,
      },
    });
  } catch (error) {
    if (error instanceof MylerzIntegrationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/admin/orders/mylerz/sync-all]", error);
    return NextResponse.json({ error: "تعذر مزامنة شحنات Mylerz حاليًا." }, { status: 500 });
  }
}
