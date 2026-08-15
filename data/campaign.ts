export const saleCampaign = {
  id: "first-100-payment-discount",
  active: true,
  discountPercent: 10,
  electronicDiscountPercent: 20,
  customerLimit: 100,
  startsAt: "2026-08-13T00:00:00+03:00",
  title: "خصم 10% عند الاستلام و20% للدفع الإلكتروني",
  message: "اختار طريقة الدفع المناسبة وخد خصمك — لأول 100 عميل",
} as const;

export type CampaignPaymentMethod = "cod" | "kashier";

export type SaleCampaignStatus = {
  active: boolean;
  discountPercent: number;
  customerLimit: number;
  claimedCustomers: number | null;
  remainingCustomers: number | null;
};

export function getPaymentDiscountPercent(method: CampaignPaymentMethod) {
  return method === "kashier"
    ? saleCampaign.electronicDiscountPercent
    : saleCampaign.discountPercent;
}

export function getDiscountedPrice(
  price: number,
  method: CampaignPaymentMethod = "cod",
) {
  const multiplier = 1 - getPaymentDiscountPercent(method) / 100;
  return Math.round(price * multiplier * 100) / 100;
}

export function getDiscountAmount(
  price: number,
  method: CampaignPaymentMethod = "cod",
) {
  return Math.round((price - getDiscountedPrice(price, method)) * 100) / 100;
}

export function isSaleAvailable(status: SaleCampaignStatus) {
  return saleCampaign.active && status.active && status.remainingCustomers !== 0;
}
