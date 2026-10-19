import type { StoredOrder } from "@/lib/order-store";

export function getOnlinePaymentAmount(order: StoredOrder) {
  return order.paymentPlan?.onlineAmount ?? (order.paymentMethod === "kashier" ? order.total : 0);
}

export function getAmountDueOnDelivery(order: StoredOrder) {
  if (order.paymentMethod !== "cod") return 0;
  if (order.total === null) return null;
  const prepaid = order.paymentStatus === "paid" ? getOnlinePaymentAmount(order) ?? 0 : 0;
  return Math.max(0, Math.round((order.total - prepaid) * 100) / 100);
}

export function isAwaitingOnlinePayment(order: StoredOrder) {
  return (getOnlinePaymentAmount(order) ?? 0) > 0 && order.paymentStatus !== "paid";
}

export function getOrderPaymentLabel(order: StoredOrder) {
  if (order.paymentMethod === "cod" && (order.paymentPlan?.onlineAmount ?? 0) > 0) {
    return order.paymentStatus === "paid" ? "الشحن مدفوع أونلاين · المنتجات عند الاستلام" : order.paymentStatus === "failed" ? "فشل دفع الشحن أونلاين" : "في انتظار دفع الشحن أونلاين";
  }
  return order.paymentStatus === "paid" ? "مدفوع" : order.paymentStatus === "failed" ? "فشل الدفع" : order.paymentStatus === "pending" ? "في انتظار الدفع" : "الدفع عند الاستلام";
}
