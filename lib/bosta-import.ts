import "server-only";

import {
  listBostaDeliveriesForImport,
  orderStatusForBostaState,
  syncBostaDelivery,
} from "@/lib/bosta";
import { getOrders, updateOrder, type StoredOrder } from "@/lib/order-store";
import { phoneComparisonKey } from "@/lib/phone";

function uniqueOrder(orders: StoredOrder[]) {
  return orders.length === 1 ? orders[0] : null;
}

export type BostaImportResult = {
  foundInBosta: number;
  linked: number;
  refreshed: number;
  unmatchedTrackingNumbers: string[];
  ambiguousTrackingNumbers: string[];
  conflicts: string[];
  orders: StoredOrder[];
};

export async function importExistingBostaDeliveries(): Promise<BostaImportResult> {
  const [imports, orders] = await Promise.all([
    listBostaDeliveriesForImport(),
    getOrders(),
  ]);
  const updatedOrders: StoredOrder[] = [];
  const unmatchedTrackingNumbers: string[] = [];
  const ambiguousTrackingNumbers: string[] = [];
  const conflicts: string[] = [];
  let linked = 0;
  let refreshed = 0;

  for (const item of imports) {
    const trackingNumber = item.shipment.trackingNumber;
    const trackingMatches = orders.filter(
      (order) => order.bosta?.trackingNumber === trackingNumber,
    );
    let order = uniqueOrder(trackingMatches);
    let matchType: "existing" | "reference" | "phone" | null = order
      ? "existing"
      : null;

    if (!order) {
      const references = new Set(
        item.businessReferences.map((value) => value.trim().toLowerCase()),
      );
      const referenceMatches = orders.filter((candidate) =>
        references.has(candidate.reference.trim().toLowerCase()),
      );
      order = uniqueOrder(referenceMatches);
      if (order) matchType = "reference";
      else if (referenceMatches.length > 1) {
        ambiguousTrackingNumbers.push(trackingNumber);
        continue;
      }
    }

    if (!order) {
      const phones = new Set(
        item.phones.map(phoneComparisonKey).filter(Boolean),
      );
      const phoneMatches = orders.filter((candidate) =>
        [candidate.customer.phone, candidate.customer.alternatePhone]
          .map(phoneComparisonKey)
          .some((phone) => phone && phones.has(phone)),
      );
      order = uniqueOrder(phoneMatches);
      if (order) matchType = "phone";
      else if (phoneMatches.length > 1) {
        ambiguousTrackingNumbers.push(trackingNumber);
        continue;
      }
    }

    if (!order) {
      unmatchedTrackingNumbers.push(trackingNumber);
      continue;
    }
    if (
      order.bosta?.trackingNumber &&
      order.bosta.trackingNumber !== trackingNumber
    ) {
      conflicts.push(trackingNumber);
      continue;
    }

    const baseShipment = {
      ...item.shipment,
      ...(order.bosta?.pickup ? { pickup: order.bosta.pickup } : {}),
    };
    const bosta = await syncBostaDelivery(baseShipment).catch(
      () => baseShipment,
    );
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
    if (!updated) continue;

    updatedOrders.push(updated);
    if (matchType === "existing") refreshed += 1;
    else linked += 1;
  }

  return {
    foundInBosta: imports.length,
    linked,
    refreshed,
    unmatchedTrackingNumbers,
    ambiguousTrackingNumbers,
    conflicts,
    orders: updatedOrders,
  };
}
