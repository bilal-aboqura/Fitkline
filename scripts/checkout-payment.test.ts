import test from "node:test";
import assert from "node:assert/strict";
import { evaluateCustomerLoyalty, isEgyptianMobile, type CustomerHistory } from "@/lib/customer-loyalty";
import { getAmountDueOnDelivery, getOnlinePaymentAmount, isAwaitingOnlinePayment } from "@/lib/order-payment";
import type { StoredOrder } from "@/lib/order-store";
import { inspectKashierPayment } from "@/lib/kashier";

const delivered: CustomerHistory = { order_status: "completed", bosta: null, mylerz: null };
const cancelled: CustomerHistory = { ...delivered, order_status: "cancelled" };
const pending: CustomerHistory = { ...delivered, order_status: "new" };

test("loyalty requires three delivered orders and an 80% receipt score", () => {
  assert.equal(evaluateCustomerLoyalty([delivered, delivered]).eligible, false);
  assert.equal(evaluateCustomerLoyalty([delivered, delivered, delivered]).eligible, true);
  assert.equal(evaluateCustomerLoyalty([delivered, delivered, delivered, cancelled]).eligible, false);
  assert.equal(evaluateCustomerLoyalty([delivered, delivered, delivered, delivered, cancelled, pending]).eligible, true);
});
test("only confirmed delivery outcomes count, with returns taking precedence", () => {
  assert.equal(evaluateCustomerLoyalty([{ ...delivered, bosta: { stateCode: 46 } }]).deliveredOrders, 0);
  assert.equal(evaluateCustomerLoyalty([{ ...pending, bosta: { stateCode: 45 } }]).deliveredOrders, 1);
  assert.equal(evaluateCustomerLoyalty([{ ...delivered, bosta: { stateCode: 45, type: "RTO" } }]).deliveredOrders, 0);
  for (const status of ["Out for delivery", "Not Delivered", "Undelivered", "Delivery failed", "Returned"]) {
    assert.equal(evaluateCustomerLoyalty([{ ...delivered, mylerz: { status } }]).deliveredOrders, 0);
  }
  assert.equal(evaluateCustomerLoyalty([{ ...pending, mylerz: { status: "Delivered" } }]).deliveredOrders, 1);
});
test("local, international, and Arabic digit mobile numbers are accepted", () => {
  for (const phone of ["01012345678", "+20 101 234 5678", "00201012345678", "٠١٠١٢٣٤٥٦٧٨", "۰۱۰۱۲۳۴۵۶۷۸"]) assert.ok(isEgyptianMobile(phone));
  assert.equal(isEgyptianMobile("123"), false);
});
function order(changes: Partial<StoredOrder> = {}) {
  return { paymentMethod: "cod", paymentStatus: "pending", total: 1100, shippingAmount: 100,
    paymentPlan: { onlineAmount: 100, fitklineCustomer: false, deliveredOrders: 0, score: 0 }, ...changes } as StoredOrder;
}
test("COD shipping sessions verify only shipping and collect only the unpaid balance", () => {
  const unpaid = order();
  assert.equal(getOnlinePaymentAmount(unpaid), 100);
  assert.ok(isAwaitingOnlinePayment(unpaid));
  assert.equal(getAmountDueOnDelivery(unpaid), 1100);
  const paidShipping = order({ paymentStatus: "paid" });
  assert.equal(isAwaitingOnlinePayment(paidShipping), false);
  assert.equal(getAmountDueOnDelivery(paidShipping), 1000);
  assert.equal(getAmountDueOnDelivery(order({ paymentStatus: "paid", total: 1200 })), 1100);
});
test("members, zero shipping, and legacy orders preserve correct collection amounts", () => {
  const member = order({ paymentPlan: { onlineAmount: 0, fitklineCustomer: true, deliveredOrders: 3, score: 100 }, paymentStatus: "not-required" });
  assert.equal(getAmountDueOnDelivery(member), 1100);
  assert.equal(isAwaitingOnlinePayment(member), false);
  assert.equal(getAmountDueOnDelivery(order({ paymentPlan: undefined })), 1100);
  assert.equal(getAmountDueOnDelivery(order({ paymentMethod: "kashier", paymentPlan: undefined, paymentStatus: "paid" })), 0);
  assert.equal(getOnlinePaymentAmount(order({ paymentMethod: "kashier", paymentPlan: undefined })), 1100);
  assert.equal(getAmountDueOnDelivery(order({ total: null })), null);
});

test("shipping payment verification rejects full order amounts, wrong sessions and forged references", () => {
  const expected = { sessionId: "shipping-session", reference: "FTK-TEST", amount: 100, currency: "EGP" };
  const data = { status: "PAID", sessionId: expected.sessionId, merchantOrderId: expected.reference, amount: "100.00", currency: "EGP" };
  assert.ok(inspectKashierPayment({ data }, expected).paid);
  for (const changes of [{ amount: "1100" }, { sessionId: "other-session" }, { merchantOrderId: "other-order" }, { currency: "USD" }]) {
    assert.equal(inspectKashierPayment({ data: { ...data, ...changes } }, expected).paid, false);
    assert.equal(inspectKashierPayment({ data: { ...data, ...changes } }, expected).integrityValid, false);
  }
});
