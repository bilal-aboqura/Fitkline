"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getOfferImage, type StoreOffer } from "@/data/offers";
import type { Product } from "@/data/products";

const STORAGE_KEY = "fitkline-offer-popup-dismissed";

export function OfferPopup({ offer, products }: { offer?: StoreOffer; products: Product[] }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!offer || window.sessionStorage.getItem(STORAGE_KEY) === offer.id) return;
    const timer = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(timer);
  }, [offer]);
  if (!offer || !open) return null;
  const dismiss = () => { window.sessionStorage.setItem(STORAGE_KEY, offer.id); setOpen(false); };
  return <div className="offer-popup" role="dialog" aria-modal="true" aria-labelledby="offer-popup-title"><button className="offer-popup__backdrop" type="button" aria-label="إغلاق العرض" onClick={dismiss} /><div className="offer-popup__panel"><button className="offer-popup__close" type="button" aria-label="إغلاق العرض" onClick={dismiss}><span /><span /></button><Link className="offer-popup__image" href={`/offers#${offer.id}`} onClick={dismiss}><Image src={getOfferImage(offer, products, true)} alt={`صورة عرض ${offer.title}`} fill sizes="(max-width: 640px) 100vw, 560px" priority /></Link><div className="offer-popup__content"><p>عرض Fitkline</p><h2 id="offer-popup-title">{offer.title}</h2>{offer.description ? <span>{offer.description}</span> : null}<Link className="fit-button-primary" href={`/offers#${offer.id}`} onClick={dismiss}>تسوق العرض <span aria-hidden="true">←</span></Link></div></div></div>;
}
