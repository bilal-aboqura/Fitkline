import Image from "next/image";
import { getOfferListPrice, getOfferPrice, type StoreOffer } from "@/data/offers";
import { formatProductPrice, type Product } from "@/data/products";

type Props = { offer: StoreOffer; products: Product[] };

/** Presentation only: all amounts come from the existing offer price helpers. */
export function OfferPrice({ offer, products }: Props) {
  const original = getOfferListPrice(offer, products);
  const price = getOfferPrice(offer, products);
  const savings = original !== null && price !== null && original > price ? Math.round((original - price) * 100) / 100 : 0;
  return <div className="bundle-price">
    <span className="bundle-price__label">سعر الباقة</span>
    {savings > 0 && <span className="bundle-price__original">بدلاً من <del>{formatProductPrice(original!)}</del></span>}
    {price === null ? <strong className="bundle-price__pending">السعر بعد تأكيد التوفر</strong> : <strong className="bundle-price__amount"><bdi>{price.toLocaleString("ar-EG", { maximumFractionDigits: 2 })}</bdi><small>ج.م</small></strong>}
    {savings > 0 && <span className="bundle-price__saving">وفر {formatProductPrice(savings)}</span>}
  </div>;
}

export function OfferContents({ offer, products }: Props) {
  return <div className="bundle-contents"><p>الباقة تشمل</p><ul>{offer.items.map((item) => {
    const product = products.find((entry) => entry.slug === item.slug);
    const size = product?.sizes.find((entry) => entry.id === item.sizeId);
    if (!product || !size) return null;
    return <li key={`${item.slug}-${item.sizeId}`}><Image src={product.sizeImages[size.id] ?? product.image} width={64} height={80} alt="" /><span><bdi>{product.name}</bdi><small>{size.label}</small></span><b className="bundle-contents__quantity" dir="ltr">×{item.quantity}</b></li>;
  })}</ul></div>;
}

export function OfferVisual({ offer, products }: Props) {
  if (offer.imageUrl) return <div className="bundle-art bundle-art--uploaded">
    <Image className={offer.mobileImageUrl ? "bundle-art__desktop" : ""} src={offer.imageUrl} alt={`عرض ${offer.title}`} fill sizes="(max-width: 760px) 100vw, 55vw" />
    {offer.mobileImageUrl && <Image className="bundle-art__mobile" src={offer.mobileImageUrl} alt={`عرض ${offer.title}`} fill sizes="(max-width: 760px) 100vw, 55vw" />}
  </div>;
  return <div className="bundle-art bundle-art--products"><div className="bundle-art__composition">{offer.items.map((item) => {
    const product = products.find((entry) => entry.slug === item.slug);
    if (!product) return null;
    return <Image key={`${item.slug}-${item.sizeId}`} src={product.sizeImages[item.sizeId] ?? product.image} alt={`${product.name} — ${product.sizes.find((size) => size.id === item.sizeId)?.label ?? ""}`} width={400} height={500} sizes="(max-width: 760px) 45vw, 28vw" />;
  })}</div><span className="bundle-art__signature" aria-hidden="true">FITKLINE</span></div>;
}
