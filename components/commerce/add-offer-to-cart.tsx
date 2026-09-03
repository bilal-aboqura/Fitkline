"use client";

import { useRouter } from "next/navigation";
import type { StoreOffer } from "@/data/offers";
import type { Product } from "@/data/products";
import { useCart } from "@/components/commerce/cart-provider";

export function AddOfferToCart({ offer, products }: { offer: StoreOffer; products: Product[] }) {
  const { addBundle } = useCart();
  const router = useRouter();
  function add() {
    const items = offer.items.flatMap((entry) => {
      const product = products.find((candidate) => candidate.slug === entry.slug);
      const size = product?.sizes.find((candidate) => candidate.id === entry.sizeId && candidate.active);
      if (!product || !size) return [];
      return Array.from({ length: entry.quantity }, () => ({ slug: product.slug, name: product.name, sizeId: size.id, sizeLabel: size.label, unitPrice: size.price, image: product.sizeImages[size.id] ?? product.image, offerId: offer.id }));
    });
    addBundle(items); router.push("/cart");
  }
  return <button className="fit-button-primary" type="button" onClick={add}>أضف الباقة للسلة <span aria-hidden="true">←</span></button>;
}
