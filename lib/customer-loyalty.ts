import { phoneComparisonKey } from "@/lib/phone";

export const FITKLINE_MIN_DELIVERIES = 3;
export const FITKLINE_MIN_SCORE = 80;

export function isEgyptianMobile(value: unknown) {
  return /^1[0125]\d{8}$/.test(phoneComparisonKey(value));
}

export type CustomerHistory = {
  order_status: string;
  bosta: { stateCode?: number; type?: string } | null;
  mylerz: { status?: string } | null;
};

export function evaluateCustomerLoyalty(history: CustomerHistory[]) {
  let deliveredOrders = 0;
  let unsuccessfulOrders = 0;
  for (const order of history) {
    const mylerz = order.mylerz?.status?.trim().toLowerCase() ?? "";
    const returned = /return|cancel|fail|reject|not delivered|undelivered/.test(mylerz);
    const bostaReturn = /RTO|RETURN|EXCHANGE/i.test(order.bosta?.type ?? "");
    // A return or cancellation takes precedence over an older completion flag.
    if (order.order_status === "cancelled" || returned || bostaReturn ||
      [46, 48, 49, 60].includes(order.bosta?.stateCode ?? -1)) {
      unsuccessfulOrders++;
    } else if (order.bosta?.stateCode === 45 ||
      /^(delivered|delivered successfully|تم التسليم)$/.test(mylerz) ||
      (!order.bosta && !order.mylerz && order.order_status === "completed")) {
      deliveredOrders++;
    }
  }
  const resolved = deliveredOrders + unsuccessfulOrders;
  const score = resolved ? Math.floor(deliveredOrders / resolved * 100) : 0;
  return {
    eligible: deliveredOrders >= FITKLINE_MIN_DELIVERIES && score >= FITKLINE_MIN_SCORE,
    deliveredOrders,
    score,
  };
}
