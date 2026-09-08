import Link from "next/link";
import { AddOfferToCart } from "@/components/commerce/add-offer-to-cart";
import { OfferContents, OfferPrice, OfferVisual } from "@/components/commerce/offer-presentation";
import type { StoreOffer } from "@/data/offers";
import type { Product } from "@/data/products";

export function OffersShowcase({ offers, products }: { offers: StoreOffer[]; products: Product[] }) {
  if (!offers.length) return null;
  return (
    <section className="home-offers" aria-labelledby="home-offers-title">
      <div className="fit-container">
        <header className="home-offers__heading">
          <div><p>عروض Fitkline</p><h2 id="home-offers-title">باقات جاهزة. <span>تشغيل أقوى.</span></h2></div>
          <Link className="home-offers__all" href="/offers">اكتشف كل الباقات <span aria-hidden="true">←</span></Link>
        </header>
        <div className="home-offers__grid">
          {offers.map((offer) => (
            <article className="home-offer" key={offer.id} aria-labelledby={`home-${offer.id}`}>
              <Link className="home-offer__visual" href={`/offers#${offer.id}`} aria-label={`شوف تفاصيل ${offer.title}`}>
                <OfferVisual offer={offer} products={products} />
              </Link>
              <div className="home-offer__body">
                <span className="bundle-tag">باقة Fitkline</span>
                <h3 id={`home-${offer.id}`}><Link href={`/offers#${offer.id}`}>{offer.title}</Link></h3>
                {offer.description && <p className="bundle-description">{offer.description}</p>}
                <OfferContents offer={offer} products={products} />
                <div className="home-offer__price"><OfferPrice offer={offer} products={products} /></div>
                <AddOfferToCart offer={offer} products={products} />
                <Link className="bundle-details" href={`/offers#${offer.id}`}>شوف تفاصيل الباقة <span aria-hidden="true">←</span></Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
