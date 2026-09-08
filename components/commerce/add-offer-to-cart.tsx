"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { StoreOffer } from "@/data/offers";
import { getOfferListPrice } from "@/data/offers";
import type { Product } from "@/data/products";
import { useCart } from "@/components/commerce/cart-provider";

export function AddOfferToCart({ offer, products }: { offer: StoreOffer; products: Product[] }) {
  const { addBundle } = useCart();
  const router = useRouter();
  const locked = useRef(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const unavailable = offer.items.some((entry) => {
    const product = products.find((candidate) => candidate.slug === entry.slug);
    const size = product?.sizes.find((candidate) => candidate.id === entry.sizeId);
    return !product?.active || !size?.active || (size.stock !== null && size.stock < entry.quantity);
  });
  function add() {
    if (locked.current || unavailable) return;
    locked.current = true;
    setError("");
    const listPrice = getOfferListPrice(offer, products);
    const items = offer.items.flatMap((entry) => {
      const product = products.find((candidate) => candidate.slug === entry.slug);
      const size = product?.sizes.find((candidate) => candidate.id === entry.sizeId && candidate.active);
      if (!product || !size) return [];
      const unitPrice = size.price === null
        ? null
        : offer.offerPrice !== null && listPrice
          ? Math.round((size.price / listPrice) * offer.offerPrice * 100) / 100
          : Math.round(size.price * (1 - offer.discountPercent / 100) * 100) / 100;
      return Array.from({ length: entry.quantity }, () => ({ slug: product.slug, name: product.name, sizeId: size.id, sizeLabel: size.label, unitPrice, image: product.sizeImages[size.id] ?? product.image, offerId: offer.id, offerTitle: offer.title }));
    });
    try {
      addBundle(items);
      setAdded(true);
      startTransition(() => router.push("/cart"));
    } catch {
      locked.current = false;
      setError("تعذر إضافة الباقة. حاول مرة تانية.");
    }
  }
  return <div className="bundle-purchase">
    <button className="fit-button-primary bundle-purchase__button" type="button" onClick={add} disabled={unavailable || added || pending} aria-busy={pending}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {added ? <path d="m5 12 4 4L19 6" /> : <><path d="M3 3h2l3 12h11l2-8H6" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></>}
      </svg>
      {unavailable ? "الباقة غير متاحة حاليًا" : pending ? "تمت الإضافة · جاري فتح السلة…" : added ? "تمت إضافة الباقة للسلة" : "أضف الباقة للسلة"}
    </button>
    <span className={error ? "bundle-purchase__error" : "sr-only"} role="status">{error || (added ? "تمت إضافة الباقة للسلة" : "")}</span>
  </div>;
}
