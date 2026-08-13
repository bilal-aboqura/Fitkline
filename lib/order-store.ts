import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { Database } from "@/lib/supabase-types";

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
    alternatePhone?: string;
    email: string;
    governorate: string;
    governorateId: string;
    city: string;
    cityId: number;
    address: string;
  };
  items: Array<{
    slug: string;
    name: string;
    sizeId: "4kg" | "20kg";
    sizeLabel: string;
    quantity: number;
    unitPrice: number | null;
    listUnitPrice?: number;
    discountPercent?: number;
  }>;
  subtotal: number | null;
  shippingAmount: number | null;
  total: number | null;
  currency: "EGP";
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  kashierSessionId?: string;
  kashierPaymentId?: string;
  notes?: string;
};

type OrderRow = {
  id: string;
  reference: string;
  created_at: string;
  updated_at: string;
  customer: StoredOrder["customer"];
  items: StoredOrder["items"];
  subtotal: number | string | null;
  shipping_amount: number | string | null;
  total: number | string | null;
  currency: "EGP";
  order_status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  kashier_session_id: string | null;
  kashier_payment_id: string | null;
  notes: string | null;
};

function nullableNumber(value: number | string | null) {
  return value === null ? null : Number(value);
}

function fromRow(row: OrderRow): StoredOrder {
  return {
    id: row.id,
    reference: row.reference,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customer: row.customer,
    items: row.items,
    subtotal: nullableNumber(row.subtotal),
    shippingAmount: nullableNumber(row.shipping_amount),
    total: nullableNumber(row.total),
    currency: row.currency,
    orderStatus: row.order_status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    ...(row.kashier_session_id
      ? { kashierSessionId: row.kashier_session_id }
      : {}),
    ...(row.kashier_payment_id
      ? { kashierPaymentId: row.kashier_payment_id }
      : {}),
    ...(row.notes ? { notes: row.notes } : {}),
  };
}

function toRow(order: StoredOrder) {
  return {
    id: order.id,
    reference: order.reference,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
    customer: order.customer,
    items: order.items,
    subtotal: order.subtotal,
    shipping_amount: order.shippingAmount,
    total: order.total,
    currency: order.currency,
    order_status: order.orderStatus,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus,
    kashier_session_id: order.kashierSessionId ?? null,
    kashier_payment_id: order.kashierPaymentId ?? null,
    notes: order.notes ?? null,
  };
}

export async function getOrders() {
  noStore();
  const { data, error } = await getSupabaseServerClient()
    .from("fitkline_orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as OrderRow[]).map(fromRow);
}

export async function createOrder(order: StoredOrder) {
  const { data, error } = await getSupabaseServerClient()
    .from("fitkline_orders")
    .insert(toRow(order))
    .select("*")
    .single();
  if (error) throw error;
  return fromRow(data as OrderRow);
}

export async function updateOrder(
  reference: string,
  changes: Partial<
    Pick<
      StoredOrder,
      | "orderStatus"
      | "paymentStatus"
      | "kashierSessionId"
      | "kashierPaymentId"
      | "notes"
    >
  >,
) {
  const updates: Database["public"]["Tables"]["fitkline_orders"]["Update"] = {
    updated_at: new Date().toISOString(),
  };
  if (changes.orderStatus !== undefined)
    updates.order_status = changes.orderStatus;
  if (changes.paymentStatus !== undefined)
    updates.payment_status = changes.paymentStatus;
  if (changes.kashierSessionId !== undefined)
    updates.kashier_session_id = changes.kashierSessionId;
  if (changes.kashierPaymentId !== undefined)
    updates.kashier_payment_id = changes.kashierPaymentId;
  if (changes.notes !== undefined) updates.notes = changes.notes;

  const { data, error } = await getSupabaseServerClient()
    .from("fitkline_orders")
    .update(updates)
    .eq("reference", reference)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as OrderRow) : null;
}

export async function findOrder(reference: string) {
  noStore();
  const { data, error } = await getSupabaseServerClient()
    .from("fitkline_orders")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as OrderRow) : null;
}
