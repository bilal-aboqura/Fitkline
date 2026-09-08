import type { Metadata } from "next";
import { OfferContents, OfferPrice, OfferVisual } from "@/components/commerce/offer-presentation";
import Link from "next/link";
import { getCmsContent } from "@/lib/cms-store";
import { AddOfferToCart } from "@/components/commerce/add-offer-to-cart";
import { isOfferPublic } from "@/data/offers";

export const metadata: Metadata = { title: "الباقات والعروض", description: "باقات Fitkline الجاهزة للمنشآت الرياضية." };

export default async function OffersPage() {
  const content = await getCmsContent();
  const products = content.products.filter((product) => product.active);
  const offers = content.offers.filter((offer) => isOfferPublic(offer)).filter((offer) => offer.items.every((entry) => products.some((product) => product.slug === entry.slug && product.sizes.some((size) => size.id === entry.sizeId && size.active)))).sort((a, b) => a.priority - b.priority);
  return (
    <main id="main-content" className="standard-page offers-page">
      <header className="offers-intro fit-container">
        <p>باقات Fitkline</p>
        <h1>اختار باقتك.<br /><span>جهّز مكانك.</span></h1>
        <p>منتجات بتكمل بعض، في باقة واحدة. شوف محتواها واختار اللي يناسب مكانك.</p>
      </header>
      <section className="offers-section" aria-label="الباقات المتاحة">
        <div className="fit-container">
          {offers.length ? <div className="offers-grid">
            {offers.map((offer) => (
              <article className="offer-card" id={offer.id} key={offer.id} aria-labelledby={`title-${offer.id}`}>
                <div className="offer-card__image"><OfferVisual offer={offer} products={products} /></div>
                <div className="offer-card__content">
                  <span className="bundle-tag">باقة العناية بمكانك</span>
                  <h2 id={`title-${offer.id}`}>{offer.title}</h2>
                  {offer.description && <p className="bundle-description">{offer.description}</p>}
                  <OfferContents offer={offer} products={products} />
                  <div className="offer-card__prices"><OfferPrice offer={offer} products={products} /></div>
                  <AddOfferToCart offer={offer} products={products} />
                  <p className="bundle-confidence">راجع منتجات الباقة والكميات في السلة قبل إتمام الطلب.</p>
                </div>
              </article>
            ))}
          </div> : <div className="empty-state"><h2>مفيش باقات مفعّلة حاليًا.</h2><p>تقدر تختار منتجاتك وأحجامك بنفسك من صفحة المنتجات.</p><Link className="fit-button-primary" href="/products">تصفح المنتجات</Link></div>}
        </div>
      </section>
    </main>
  );
}
