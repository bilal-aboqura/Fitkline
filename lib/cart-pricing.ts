import { getProductPrice, type Product, type ProductSize } from "@/data/products";
import { getOfferListPrice, isOfferPublic, type StoreOffer } from "@/data/offers";
import type { CartItem } from "@/components/commerce/cart-provider";

type PricingItem = { slug?: unknown; sizeId?: unknown; quantity?: unknown; offerId?: unknown };
type OfferPricing = { offer: StoreOffer; listPrice: number | null };
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

/** Round each unit through the same price rule used when the order is saved. */
export function getCartSubtotal(items: Array<Pick<CartItem, "unitPrice" | "quantity">>, priceFor = (price: number) => price) {
  if (items.some((item) => typeof item.unitPrice !== "number")) return null;
  return items.reduce((total, item) => total + priceFor(item.unitPrice!) * item.quantity, 0);
}

export function getValidBundleOffers(items: PricingItem[], offers: StoreOffer[], products: readonly Product[]) {
  const valid = new Map<string, OfferPricing>();
  for (const offer of offers.filter((candidate) => isOfferPublic(candidate))) {
    const submitted = items.filter((item) => text(item.offerId) === offer.id);
    const exact = submitted.length === offer.items.length && offer.items.every((required) =>
      submitted.some((item) => text(item.slug) === required.slug && text(item.sizeId) === required.sizeId && Number(item.quantity) === required.quantity));
    if (exact) valid.set(offer.id, { offer, listPrice: getOfferListPrice(offer, products) });
  }
  return valid;
}

/** Bundle pricing takes precedence over an individual product's discount. */
export function getLinePrice(size: ProductSize, quantity: number, bundle?: OfferPricing) {
  if (size.price === null) return null;
  if (!bundle) return getProductPrice(size);
  if (bundle.offer.offerPrice !== null && bundle.listPrice) {
    return Math.round(size.price * quantity / bundle.listPrice * bundle.offer.offerPrice * 100) / 100 / quantity;
  }
  return Math.round(size.price * (1 - bundle.offer.discountPercent / 100) * 100) / 100;
}

/** Resolve saved carts against the current catalog, never a browser's old price. */
export function repriceCartItems(items: CartItem[], products: Product[], offers: StoreOffer[]) {
  const validOffers = getValidBundleOffers(items, offers, products);
  return items.map((item) => {
    const product = products.find((candidate) => candidate.slug === item.slug && candidate.active);
    const size = product?.sizes.find((candidate) => candidate.id === item.sizeId && candidate.active);
    if (!size) return { ...item, unitPrice: null, listUnitPrice: null, offerUnavailable: Boolean(item.offerId) };
    const bundle = item.offerId ? validOffers.get(item.offerId) : undefined;
    return { ...item, name: product!.name, unitPrice: getLinePrice(size, item.quantity, bundle), listUnitPrice: size.price, offerUnavailable: Boolean(item.offerId && !bundle) };
  });
}
