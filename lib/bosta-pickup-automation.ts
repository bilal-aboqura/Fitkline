import "server-only";

import {
  BostaIntegrationError,
  createBostaDelivery,
  createBostaPickup,
  downloadBostaAwb,
  getAvailableBostaPickupDates,
  listBostaPickupLocations,
  type BostaPickup,
} from "@/lib/bosta";
import { getOrders, updateOrder, type StoredOrder } from "@/lib/order-store";
import {
  claimBostaPickupAutomation,
  getBostaPickups,
  updateBostaPickup,
} from "@/lib/pickup-store";
import { notifyTelegramAboutBostaPickup } from "@/lib/telegram";

const CAIRO_TIME_ZONE = "Africa/Cairo";
const MINIMUM_CONFIRMED_ORDERS = 3;

function cairoClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CAIRO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${value.year}-${value.month}-${value.day}`,
    hour: Number(value.hour),
  };
}

function hasBigItems(order: StoredOrder) {
  return order.items.some(
    (item) => Number.parseFloat(item.sizeId) >= 20 && item.quantity > 0,
  );
}

async function sendPickupToTelegram(
  pickup: BostaPickup,
  orders: StoredOrder[],
) {
  const trackingNumbers = orders
    .map((order) => order.bosta?.trackingNumber)
    .filter((value): value is string => Boolean(value));
  const awbPdf = await downloadBostaAwb(trackingNumbers.join(","));
  await notifyTelegramAboutBostaPickup({ pickup, orders, awbPdf });
}

async function retryPendingTelegramDocuments(orders: StoredOrder[]) {
  const pending = (await getBostaPickups(10)).filter(
    (pickup) =>
      pickup.status === "completed" &&
      !pickup.telegramSent &&
      pickup.bostaPickupId &&
      pickup.scheduledDate &&
      pickup.trackingNumbers.length,
  );
  for (const record of pending) {
    const related = record.orderReferences
      .map((reference) => orders.find((order) => order.reference === reference))
      .filter((order): order is StoredOrder => Boolean(order));
    if (!related.length) continue;
    try {
      await sendPickupToTelegram(
        {
          id: record.bostaPickupId!,
          ...(record.puid ? { puid: record.puid } : {}),
          scheduledDate: record.scheduledDate!,
          ...(record.scheduledTimeSlot
            ? { scheduledTimeSlot: record.scheduledTimeSlot }
            : {}),
          state: record.state ?? "Requested",
          businessLocationId: record.businessLocationId ?? "",
        },
        related,
      );
      await updateBostaPickup(record.automationKey, {
        telegramSent: true,
        error: null,
      });
    } catch (error) {
      await updateBostaPickup(record.automationKey, {
        error: error instanceof Error ? error.message : "Telegram send failed",
      });
    }
  }
}

export async function runBostaPickupAutomation(options?: {
  ignoreTime?: boolean;
  now?: Date;
}) {
  const clock = cairoClock(options?.now);
  const orders = await getOrders();
  await retryPendingTelegramDocuments(orders);

  if (!options?.ignoreTime && clock.hour !== 0) {
    return { status: "outside-window" as const, cairoDate: clock.date };
  }

  const candidates = orders.filter(
    (order) =>
      order.orderStatus === "confirmed" && !order.bosta?.pickup?.id,
  );
  const automationKey = `daily-pickup:${clock.date}`;
  if (candidates.length < MINIMUM_CONFIRMED_ORDERS) {
    const claimed = await claimBostaPickupAutomation(
      automationKey,
      candidates.length,
    );
    if (claimed) {
      await updateBostaPickup(automationKey, {
        status: "skipped",
        parcelCount: candidates.length,
        error: `Waiting for at least ${MINIMUM_CONFIRMED_ORDERS} confirmed orders.`,
      });
    }
    return {
      status: "below-minimum" as const,
      confirmedOrders: candidates.length,
      minimum: MINIMUM_CONFIRMED_ORDERS,
    };
  }

  const claimed = await claimBostaPickupAutomation(
    automationKey,
    candidates.length,
  );
  if (!claimed) return { status: "already-ran" as const };

  try {
    const locations = await listBostaPickupLocations();
    const location = locations.find((item) => item.isDefault) ?? locations[0];
    if (!location) {
      throw new BostaIntegrationError(
        "لا يوجد مكان استلام في حساب بوسطة.",
        400,
      );
    }

    const readyOrders: StoredOrder[] = [];
    const creationErrors: string[] = [];
    for (const order of candidates) {
      try {
        const bosta = order.bosta ?? (await createBostaDelivery(order));
        const stored = await updateOrder(order.reference, { bosta });
        if (stored) readyOrders.push(stored);
      } catch (error) {
        creationErrors.push(
          `${order.reference}: ${error instanceof Error ? error.message : "تعذر إنشاء الشحنة"}`,
        );
      }
    }
    if (readyOrders.length < MINIMUM_CONFIRMED_ORDERS) {
      throw new BostaIntegrationError(
        `تم تجهيز ${readyOrders.length} شحنة فقط. ${creationErrors.join(" | ")}`,
        400,
      );
    }

    const dates = await getAvailableBostaPickupDates(7);
    const scheduledDate = dates[0];
    if (!scheduledDate) {
      throw new BostaIntegrationError(
        "بوسطة لم ترسل أي تاريخ متاح للاستلام.",
      );
    }
    const trackingNumbers = readyOrders.map(
      (order) => order.bosta!.trackingNumber,
    );
    const pickup = await createBostaPickup({
      location,
      scheduledDate,
      trackingNumbers,
      hasBigItems: readyOrders.some(hasBigItems),
      hasFragileItems:
        process.env.BOSTA_PICKUP_HAS_FRAGILE_ITEMS === "true",
      notes:
        process.env.BOSTA_PICKUP_NOTES ??
        `Fitkline automatic pickup — ${readyOrders.length} confirmed orders`,
    });

    const updatedOrders: StoredOrder[] = [];
    for (const order of readyOrders) {
      const updated = await updateOrder(order.reference, {
        orderStatus: "processing",
        bosta: {
          ...order.bosta!,
          pickup: {
            id: pickup.id,
            ...(pickup.puid ? { puid: pickup.puid } : {}),
            scheduledDate: pickup.scheduledDate,
            ...(pickup.scheduledTimeSlot
              ? { scheduledTimeSlot: pickup.scheduledTimeSlot }
              : {}),
          },
        },
      });
      if (updated) updatedOrders.push(updated);
    }

    await updateBostaPickup(automationKey, {
      bostaPickupId: pickup.id,
      puid: pickup.puid,
      scheduledDate: pickup.scheduledDate,
      scheduledTimeSlot: pickup.scheduledTimeSlot,
      state: pickup.state,
      businessLocationId: pickup.businessLocationId,
      orderReferences: updatedOrders.map((order) => order.reference),
      trackingNumbers,
      parcelCount: updatedOrders.length,
      status: "completed",
      telegramSent: false,
      error: creationErrors.length ? creationErrors.join(" | ") : null,
    });

    try {
      await sendPickupToTelegram(pickup, updatedOrders);
      await updateBostaPickup(automationKey, {
        telegramSent: true,
        error: creationErrors.length ? creationErrors.join(" | ") : null,
      });
    } catch (error) {
      await updateBostaPickup(automationKey, {
        telegramSent: false,
        error: error instanceof Error ? error.message : "Telegram send failed",
      });
    }

    return {
      status: "scheduled" as const,
      pickupId: pickup.id,
      scheduledDate: pickup.scheduledDate,
      orders: updatedOrders.length,
    };
  } catch (error) {
    await updateBostaPickup(automationKey, {
      status: "failed",
      error: error instanceof Error ? error.message : "Pickup automation failed",
    });
    throw error;
  }
}
