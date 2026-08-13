import "server-only";

import {
  saleCampaign,
  type SaleCampaignStatus,
} from "@/data/campaign";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { phoneComparisonKey } from "@/lib/phone";

type CampaignOrderRow = {
  customer: { phone?: unknown } | null;
  order_status: string;
};

async function getCampaignCustomerPhones() {
  const { data, error } = await getSupabaseServerClient()
    .from("fitkline_orders")
    .select("customer,order_status")
    .gte("created_at", saleCampaign.startsAt)
    .neq("order_status", "cancelled");

  if (error) throw error;

  return new Set(
    ((data ?? []) as CampaignOrderRow[])
      .map((order) => phoneComparisonKey(order.customer?.phone))
      .filter(Boolean),
  );
}

export async function getSaleCampaignStatus(): Promise<SaleCampaignStatus> {
  if (!saleCampaign.active) {
    return {
      active: false,
      discountPercent: saleCampaign.discountPercent,
      customerLimit: saleCampaign.customerLimit,
      claimedCustomers: 0,
      remainingCustomers: 0,
    };
  }

  try {
    const phones = await getCampaignCustomerPhones();
    const claimedCustomers = Math.min(phones.size, saleCampaign.customerLimit);

    return {
      active: claimedCustomers < saleCampaign.customerLimit,
      discountPercent: saleCampaign.discountPercent,
      customerLimit: saleCampaign.customerLimit,
      claimedCustomers,
      remainingCustomers: Math.max(
        0,
        saleCampaign.customerLimit - claimedCustomers,
      ),
    };
  } catch (error) {
    console.error("[sale campaign status]", error);
    return {
      active: true,
      discountPercent: saleCampaign.discountPercent,
      customerLimit: saleCampaign.customerLimit,
      claimedCustomers: null,
      remainingCustomers: null,
    };
  }
}

export async function isCustomerEligibleForSale(phone: string) {
  if (!saleCampaign.active) return false;

  try {
    const phones = await getCampaignCustomerPhones();
    const normalizedPhone = phoneComparisonKey(phone);
    return (
      phones.has(normalizedPhone) || phones.size < saleCampaign.customerLimit
    );
  } catch (error) {
    console.error("[sale campaign eligibility]", error);
    return true;
  }
}
