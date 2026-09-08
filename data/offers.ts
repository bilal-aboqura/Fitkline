import type { Product, ProductSizeId } from "@/data/products";

export type OfferItem = {
  slug: string;
  sizeId: ProductSizeId;
  quantity: number;
};

export type StoreOffer = {
  id: string;
  title: string;
  description: string;
  /** Kept while older CMS documents are migrated in place. */
  active: boolean;
  status: "draft" | "active" | "inactive";
  imageUrl: string;
  mobileImageUrl: string;
  discountPercent: number;
  offerPrice: number | null;
  startAt: string;
  endAt: string;
  showOnHomepage: boolean;
  showAsPopup: boolean;
  priority: number;
  items: OfferItem[];
};

type LegacyOffer = Partial<StoreOffer> & { items?: OfferItem[] };

export function normalizeOffer(value: LegacyOffer): StoreOffer {
  const status = value.status === "draft" || value.status === "inactive" || value.status === "active" ? value.status : value.active ? "active" : "draft";
  return { id: value.id ?? "", title: value.title ?? "", description: value.description ?? "", active: status === "active", status, imageUrl: value.imageUrl ?? "", mobileImageUrl: value.mobileImageUrl ?? "", discountPercent: value.discountPercent ?? 0, offerPrice: typeof value.offerPrice === "number" ? value.offerPrice : null, startAt: value.startAt ?? "", endAt: value.endAt ?? "", showOnHomepage: value.showOnHomepage ?? true, showAsPopup: value.showAsPopup ?? false, priority: Number.isInteger(value.priority) ? value.priority! : 0, items: value.items ?? [] };
}

export function normalizeOffers(value: unknown): StoreOffer[] {
  return Array.isArray(value) ? value.map((offer) => normalizeOffer(offer as LegacyOffer)) : [];
}

export type OfferState = "draft" | "active" | "scheduled" | "expired" | "inactive";

export function getOfferState(offer: StoreOffer, now = new Date()): OfferState {
  if (offer.status === "draft") return "draft";
  if (offer.status === "inactive") return "inactive";
  const startAt = offer.startAt ? new Date(offer.startAt) : null;
  const endAt = offer.endAt ? new Date(offer.endAt) : null;
  if (startAt && !Number.isNaN(startAt.valueOf()) && startAt > now) return "scheduled";
  if (endAt && !Number.isNaN(endAt.valueOf()) && endAt <= now) return "expired";
  return "active";
}

export function isOfferPublic(offer: StoreOffer, now = new Date()) { return getOfferState(offer, now) === "active"; }

export function getOfferListPrice(offer: StoreOffer, products: readonly Product[]) {
  let total = 0;
  for (const item of offer.items) {
    const size = products.find((product) => product.slug === item.slug)?.sizes.find((candidate) => candidate.id === item.sizeId);
    if (!size || typeof size.price !== "number") return null;
    total += size.price * item.quantity;
  }
  return total;
}

export function getOfferPrice(offer: StoreOffer, products: readonly Product[]) {
  const listPrice = getOfferListPrice(offer, products);
  return listPrice === null ? null : offer.offerPrice ?? Math.round(listPrice * (1 - offer.discountPercent / 100) * 100) / 100;
}

export function getOfferImage(offer: StoreOffer, products: readonly Product[], mobile = false) {
  const fallback = products.find((product) => product.slug === offer.items[0]?.slug);
  return (mobile ? offer.mobileImageUrl : offer.imageUrl) || offer.imageUrl || fallback?.sizeImages[offer.items[0]?.sizeId] || fallback?.image || "";
}

function isSupportedAssetUrl(value: string) {
  if (!value || value.startsWith("/")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "yefvzsdnexduqtfengcp.supabase.co" && url.pathname.startsWith("/storage/v1/object/public/fitkline-assets/");
  } catch { return false; }
}

export function validateOffers(value: unknown): asserts value is StoreOffer[] {
  if (!Array.isArray(value)) throw new Error("العروض يجب أن تكون قائمة.");
  const ids = new Set<string>();
  for (const rawOffer of value) {
    if (!rawOffer || typeof rawOffer !== "object") throw new Error("بيانات العرض غير صالحة.");
    const offer = normalizeOffer(rawOffer as LegacyOffer);
    if (!offer.id || !/^[a-z0-9-]+$/.test(offer.id) || ids.has(offer.id)) throw new Error("معرّف العرض غير صالح أو مكرر.");
    if (!offer.title.trim()) throw new Error("اكتب اسم العرض.");
    if (!isSupportedAssetUrl(offer.imageUrl) || !isSupportedAssetUrl(offer.mobileImageUrl)) throw new Error("استخدم صورة من تخزين Fitkline أو رابطًا محليًا صالحًا.");
    if (!Number.isFinite(offer.discountPercent) || offer.discountPercent < 0 || offer.discountPercent > 100) throw new Error("نسبة الخصم يجب أن تكون بين 0 و100.");
    if (offer.offerPrice !== null && (!Number.isFinite(offer.offerPrice) || offer.offerPrice < 0)) throw new Error("سعر الباقة غير صالح.");
    if (!Number.isInteger(offer.priority) || offer.priority < 0) throw new Error("ترتيب العرض غير صالح.");
    for (const field of [offer.startAt, offer.endAt]) if (field && Number.isNaN(new Date(field).valueOf())) throw new Error("تاريخ العرض غير صالح.");
    if (offer.startAt && offer.endAt && new Date(offer.startAt) >= new Date(offer.endAt)) throw new Error("تاريخ النهاية يجب أن يكون بعد تاريخ البداية.");
    if (!Array.isArray(offer.items) || !offer.items.length) throw new Error("أضف منتجًا واحدًا على الأقل للباقة.");
    const variants = new Set<string>();
    for (const bundleItem of offer.items) {
      const key = `${bundleItem?.slug}:${bundleItem?.sizeId}`;
      if (!bundleItem || typeof bundleItem.slug !== "string" || !["4kg", "20kg"].includes(bundleItem.sizeId) || !Number.isInteger(bundleItem.quantity) || bundleItem.quantity < 1 || variants.has(key)) {
        throw new Error("أحد عناصر الباقة غير صالح.");
      }
      variants.add(key);
    }
    ids.add(offer.id);
  }
}
