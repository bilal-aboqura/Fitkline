import "server-only";

import type { StoredOrder } from "@/lib/order-store";

const TELEGRAM_API_BASE = "https://api.telegram.org";
const TELEGRAM_REQUEST_TIMEOUT_MS = 8_000;
const TELEGRAM_MESSAGE_MAX_CHARACTERS = 4_096;

type TelegramResponse = {
  ok?: boolean;
  description?: string;
};

function getTelegramConfiguration() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim() ?? "";

  return {
    botToken,
    chatId,
    ready: Boolean(botToken && chatId),
  };
}

function formatMoney(amount: number | null, currency: StoredOrder["currency"]) {
  if (amount === null) return "السعر قيد التأكيد";

  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatOrderTime(createdAt: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Cairo",
  }).format(new Date(createdAt));
}

function singleLine(value: string) {
  return value.replace(/\s+/gu, " ").trim();
}

function fitTelegramMessage(value: string) {
  const characters = Array.from(value);
  if (characters.length <= TELEGRAM_MESSAGE_MAX_CHARACTERS) return value;

  return `${characters.slice(0, TELEGRAM_MESSAGE_MAX_CHARACTERS - 1).join("")}…`;
}

export function formatNewOrderNotification(order: StoredOrder) {
  const paymentMethod =
    order.paymentMethod === "kashier" ? "دفع إلكتروني (Kashier)" : "الدفع عند الاستلام";
  const paymentStatus =
    order.paymentStatus === "pending"
      ? "في انتظار الدفع"
      : order.paymentStatus === "paid"
        ? "مدفوع"
        : order.paymentStatus === "failed"
          ? "فشل الدفع"
          : "الدفع عند الاستلام";
  const itemLines = order.items.map((item, index) => {
    const lineTotal =
      item.unitPrice === null ? null : item.unitPrice * item.quantity;
    return `${index + 1}. ${singleLine(item.name)} — ${singleLine(item.sizeLabel)} × ${item.quantity} — ${formatMoney(lineTotal, order.currency)}`;
  });
  const discountPercent = order.items.find(
    (item) => item.discountPercent,
  )?.discountPercent;
  const listSubtotal = order.items.reduce<number | null>((total, item) => {
    const unitPrice = item.listUnitPrice ?? item.unitPrice;
    return total === null || unitPrice === null
      ? null
      : total + unitPrice * item.quantity;
  }, 0);
  const discountAmount =
    listSubtotal === null || order.subtotal === null
      ? null
      : Math.max(0, listSubtotal - order.subtotal);

  const message = [
    "🛒 طلب جديد — Fitkline",
    "",
    `رقم الطلب: ${order.reference}`,
    `التاريخ: ${formatOrderTime(order.createdAt)}`,
    "",
    `العميل: ${singleLine(order.customer.name)}`,
    `الهاتف الأساسي: ${singleLine(order.customer.phone)}`,
    ...(order.customer.alternatePhone
      ? [`الهاتف البديل: ${singleLine(order.customer.alternatePhone)}`]
      : []),
    `البريد: ${singleLine(order.customer.email)}`,
    `العنوان: ${singleLine(order.customer.governorate)}، ${singleLine(order.customer.city)}، ${singleLine(order.customer.address)}`,
    "",
    "المنتجات:",
    ...itemLines,
    "",
    ...(discountPercent
      ? [
          `خصم طريقة الدفع: ${discountPercent}%${discountAmount === null ? "" : ` — ${formatMoney(discountAmount, order.currency)}`}`,
        ]
      : []),
    `المجموع الفرعي: ${formatMoney(order.subtotal, order.currency)}`,
    `الشحن: ${formatMoney(order.shippingAmount, order.currency)}`,
    `الإجمالي: ${formatMoney(order.total, order.currency)}`,
    `طريقة الدفع: ${paymentMethod}`,
    `حالة الدفع: ${paymentStatus}`,
  ].join("\n");

  return fitTelegramMessage(message);
}

export async function notifyTelegramAboutNewOrder(order: StoredOrder) {
  const config = getTelegramConfiguration();
  if (!config.ready) {
    console.warn(
      `[telegram] Skipped notification for ${order.reference}: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing.`,
    );
    return false;
  }

  let response: Response;
  try {
    response = await fetch(
      `${TELEGRAM_API_BASE}/bot${config.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: config.chatId,
          text: formatNewOrderNotification(order),
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(TELEGRAM_REQUEST_TIMEOUT_MS),
      },
    );
  } catch {
    throw new Error("Could not reach the Telegram Bot API.");
  }

  const result = (await response.json().catch(() => null)) as TelegramResponse | null;
  if (!response.ok || !result?.ok) {
    throw new Error(
      `Telegram rejected the order notification (${response.status}): ${result?.description ?? "Unknown error"}`,
    );
  }

  return true;
}
