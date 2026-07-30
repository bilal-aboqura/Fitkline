import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { unstable_noStore as noStore } from "next/cache";

export type OrderStatus =
  | "new"
  | "confirmed"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "not-required";
export type PaymentMethod = "cod" | "kashier";

export type StoredOrder = {
  id: string;
  reference: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    governorate: string;
    address: string;
  };
  items: Array<{
    slug: string;
    name: string;
    sizeId: "4kg" | "20kg";
    sizeLabel: string;
    quantity: number;
    unitPrice: number | null;
  }>;
  subtotal: number | null;
  currency: "EGP";
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  kashierSessionId?: string;
  kashierPaymentId?: string;
  notes?: string;
};

const ordersPath = path.join(process.cwd(), "data", "orders.json");

export async function getOrders() {
  noStore();
  const raw = await fs.readFile(ordersPath, "utf8");
  const orders = JSON.parse(raw) as StoredOrder[];
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function writeOrders(orders: StoredOrder[]) {
  const temporaryPath = `${ordersPath}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(orders, null, 2)}\n`, "utf8");
  await fs.rename(temporaryPath, ordersPath);
}

export async function createOrder(order: StoredOrder) {
  const orders = await getOrders();
  await writeOrders([order, ...orders]);
  return order;
}

export async function updateOrder(
  reference: string,
  changes: Partial<Pick<StoredOrder, "orderStatus" | "paymentStatus" | "kashierSessionId" | "kashierPaymentId" | "notes">>,
) {
  const orders = await getOrders();
  let updated: StoredOrder | undefined;
  const next = orders.map((order) => {
    if (order.reference !== reference) return order;
    updated = { ...order, ...changes, updatedAt: new Date().toISOString() };
    return updated;
  });
  if (!updated) return null;
  await writeOrders(next);
  return updated;
}

export async function findOrder(reference: string) {
  const orders = await getOrders();
  return orders.find((order) => order.reference === reference) ?? null;
}

