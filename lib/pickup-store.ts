import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export type PickupAutomationStatus =
  | "running"
  | "completed"
  | "skipped"
  | "failed";

export type StoredBostaPickup = {
  automationKey: string;
  bostaPickupId?: string;
  puid?: string;
  scheduledDate?: string;
  scheduledTimeSlot?: string;
  state?: string;
  businessLocationId?: string;
  orderReferences: string[];
  trackingNumbers: string[];
  parcelCount: number;
  telegramSent: boolean;
  status: PickupAutomationStatus;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

type PickupRow = {
  automation_key: string;
  bosta_pickup_id: string | null;
  puid: string | null;
  scheduled_date: string | null;
  scheduled_time_slot: string | null;
  state: string | null;
  business_location_id: string | null;
  order_references: unknown;
  tracking_numbers: unknown;
  parcel_count: number;
  telegram_sent: boolean;
  status: PickupAutomationStatus;
  error: string | null;
  created_at: string;
  updated_at: string;
};

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function fromRow(row: PickupRow): StoredBostaPickup {
  return {
    automationKey: row.automation_key,
    ...(row.bosta_pickup_id ? { bostaPickupId: row.bosta_pickup_id } : {}),
    ...(row.puid ? { puid: row.puid } : {}),
    ...(row.scheduled_date ? { scheduledDate: row.scheduled_date } : {}),
    ...(row.scheduled_time_slot
      ? { scheduledTimeSlot: row.scheduled_time_slot }
      : {}),
    ...(row.state ? { state: row.state } : {}),
    ...(row.business_location_id
      ? { businessLocationId: row.business_location_id }
      : {}),
    orderReferences: stringArray(row.order_references),
    trackingNumbers: stringArray(row.tracking_numbers),
    parcelCount: row.parcel_count,
    telegramSent: row.telegram_sent,
    status: row.status,
    ...(row.error ? { error: row.error } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getBostaPickups(limit = 10) {
  noStore();
  const { data, error } = await getSupabaseServerClient()
    .from("fitkline_bosta_pickups")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(50, limit)));
  if (error) throw error;
  return ((data ?? []) as PickupRow[]).map(fromRow);
}

export async function getBostaPickup(automationKey: string) {
  noStore();
  const { data, error } = await getSupabaseServerClient()
    .from("fitkline_bosta_pickups")
    .select("*")
    .eq("automation_key", automationKey)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as PickupRow) : null;
}

export async function claimBostaPickupAutomation(
  automationKey: string,
  parcelCount: number,
) {
  const existing = await getBostaPickup(automationKey);
  if (existing?.status === "completed") return false;
  if (
    existing?.status === "running" &&
    Date.now() - new Date(existing.updatedAt).getTime() < 30 * 60 * 1000
  ) {
    return false;
  }

  const now = new Date().toISOString();
  const { error } = await getSupabaseServerClient()
    .from("fitkline_bosta_pickups")
    .upsert(
      {
        automation_key: automationKey,
        status: "running",
        parcel_count: parcelCount,
        error: null,
        updated_at: now,
        ...(existing ? {} : { created_at: now }),
      },
      { onConflict: "automation_key" },
    );
  if (error) throw error;
  return true;
}

export async function updateBostaPickup(
  automationKey: string,
  changes: {
    bostaPickupId?: string;
    puid?: string;
    scheduledDate?: string;
    scheduledTimeSlot?: string;
    state?: string;
    businessLocationId?: string;
    orderReferences?: string[];
    trackingNumbers?: string[];
    parcelCount?: number;
    telegramSent?: boolean;
    status?: PickupAutomationStatus;
    error?: string | null;
  },
) {
  const update = {
    updated_at: new Date().toISOString(),
    ...(changes.bostaPickupId !== undefined
      ? { bosta_pickup_id: changes.bostaPickupId }
      : {}),
    ...(changes.puid !== undefined ? { puid: changes.puid } : {}),
    ...(changes.scheduledDate !== undefined
      ? { scheduled_date: changes.scheduledDate }
      : {}),
    ...(changes.scheduledTimeSlot !== undefined
      ? { scheduled_time_slot: changes.scheduledTimeSlot }
      : {}),
    ...(changes.state !== undefined ? { state: changes.state } : {}),
    ...(changes.businessLocationId !== undefined
      ? { business_location_id: changes.businessLocationId }
      : {}),
    ...(changes.orderReferences !== undefined
      ? { order_references: changes.orderReferences }
      : {}),
    ...(changes.trackingNumbers !== undefined
      ? { tracking_numbers: changes.trackingNumbers }
      : {}),
    ...(changes.parcelCount !== undefined
      ? { parcel_count: changes.parcelCount }
      : {}),
    ...(changes.telegramSent !== undefined
      ? { telegram_sent: changes.telegramSent }
      : {}),
    ...(changes.status !== undefined ? { status: changes.status } : {}),
    ...(changes.error !== undefined ? { error: changes.error } : {}),
  };
  const { data, error } = await getSupabaseServerClient()
    .from("fitkline_bosta_pickups")
    .update(update)
    .eq("automation_key", automationKey)
    .select("*")
    .single();
  if (error) throw error;
  return fromRow(data as PickupRow);
}
