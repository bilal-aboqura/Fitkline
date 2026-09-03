import type { ProductSizeId } from "@/data/products";

export type OfferItem = {
  slug: string;
  sizeId: ProductSizeId;
  quantity: number;
};

export type StoreOffer = {
  id: string;
  title: string;
  description: string;
  active: boolean;
  discountPercent: number;
  items: OfferItem[];
};

export function validateOffers(value: unknown): asserts value is StoreOffer[] {
  if (!Array.isArray(value)) throw new Error("العروض يجب أن تكون قائمة.");
  const ids = new Set<string>();
  for (const offer of value) {
    if (!offer || typeof offer !== "object") throw new Error("بيانات العرض غير صالحة.");
    const item = offer as Partial<StoreOffer>;
    if (!item.id || !/^[a-z0-9-]+$/.test(item.id) || ids.has(item.id)) throw new Error("معرّف العرض غير صالح أو مكرر.");
    if (typeof item.title !== "string" || !item.title.trim()) throw new Error("اكتب اسم العرض.");
    if (typeof item.description !== "string") throw new Error("وصف العرض غير صالح.");
    if (typeof item.active !== "boolean") throw new Error("حالة العرض غير صالحة.");
    if (!Number.isFinite(item.discountPercent) || item.discountPercent! < 0 || item.discountPercent! > 100) throw new Error("نسبة الخصم يجب أن تكون بين 0 و100.");
    if (!Array.isArray(item.items) || !item.items.length) throw new Error("أضف منتجًا واحدًا على الأقل للباقة.");
    for (const bundleItem of item.items) {
      if (!bundleItem || typeof bundleItem.slug !== "string" || !["4kg", "20kg"].includes(bundleItem.sizeId) || !Number.isInteger(bundleItem.quantity) || bundleItem.quantity < 1) {
        throw new Error("أحد عناصر الباقة غير صالح.");
      }
    }
    ids.add(item.id);
  }
}
