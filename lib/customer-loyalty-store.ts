import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { phoneComparisonKey } from "@/lib/phone";
import { evaluateCustomerLoyalty, isEgyptianMobile, type CustomerHistory } from "@/lib/customer-loyalty";

export async function getCustomerLoyalty(phone: string) {
  if (!isEgyptianMobile(phone)) return evaluateCustomerLoyalty([]);
  const { data, error } = await getSupabaseServerClient().rpc("fitkline_customer_history", {
    p_phone: phoneComparisonKey(phone),
  });
  if (error) throw error;
  return evaluateCustomerLoyalty((data ?? []) as unknown as CustomerHistory[]);
}
