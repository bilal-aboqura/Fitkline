export const saleCampaign = {
  id: "first-100-10",
  active: true,
  discountPercent: 10,
  customerLimit: 100,
  startsAt: "2026-08-13T00:00:00+03:00",
  title: "خصم 10% على كل المنتجات",
  message: "لأول 100 عميل فقط",
} as const;

export type SaleCampaignStatus = {
  active: boolean;
  discountPercent: number;
  customerLimit: number;
  claimedCustomers: number | null;
  remainingCustomers: number | null;
};

export function getDiscountedPrice(price: number) {
  const multiplier = 1 - saleCampaign.discountPercent / 100;
  return Math.round(price * multiplier * 100) / 100;
}

export function getDiscountAmount(price: number) {
  return Math.round((price - getDiscountedPrice(price)) * 100) / 100;
}

export function isSaleAvailable(status: SaleCampaignStatus) {
  return saleCampaign.active && status.active && status.remainingCustomers !== 0;
}
