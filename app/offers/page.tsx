import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCmsContent } from "@/lib/cms-store";
import { AddOfferToCart } from "@/components/commerce/add-offer-to-cart";

export const metadata: Metadata = { title: "الباقات والعروض", description: "باقات Fitkline الجاهزة للمنشآت الرياضية." };

export default async function OffersPage() {
  const content = await getCmsContent();
  const offers = content.offers.filter((offer) => offer.active).filter((offer) => offer.items.every((entry) => content.products.some((product) => product.active && product.slug === entry.slug && product.sizes.some((size) => size.id === entry.sizeId && size.active))));
  return <main id="main-content" className="standard-page offers-page"><section className="page-hero page-hero--redesign"><div className="fit-container page-hero__layout"><div className="page-hero__inner"><p className="section-heading__kicker">FITKLINE OFFERS</p><h1>باقة جاهزة.<br /><span>تشغيل أقوى.</span></h1><p>اختار الباقة المناسبة لمكانك. السعر والخصم بيتأكدوا تلقائيًا من الأسعار الحالية وقت الطلب.</p></div></div></section><section className="offers-section"><div className="fit-container">{offers.length ? <div className="offers-grid">{offers.map((offer) => <article className="offer-card" key={offer.id}><div className="offer-card__header"><span>باقة Fitkline</span><b>خصم {offer.discountPercent}%</b></div><h2>{offer.title}</h2><p>{offer.description}</p><ul>{offer.items.map((entry, index) => { const product = content.products.find((candidate) => candidate.slug === entry.slug)!; const size = product.sizes.find((candidate) => candidate.id === entry.sizeId)!; return <li key={`${entry.slug}-${index}`}><Image src={product.sizeImages[size.id] ?? product.image} alt="" width={70} height={86} /><span dir="ltr">{product.name}</span><strong>{entry.quantity} × {size.label}</strong></li>; })}</ul><AddOfferToCart offer={offer} products={content.products} /></article>)}</div> : <div className="empty-state"><h2>مفيش باقات مفعّلة حاليًا.</h2><p>تقدر تختار منتجاتك وأحجامك بنفسك من صفحة المنتجات.</p><Link className="fit-button-primary" href="/products">تصفح المنتجات</Link></div>}</div></section></main>;
}
