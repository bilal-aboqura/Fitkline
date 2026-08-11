import Image from "next/image";
import Link from "next/link";
import { ProductPurchase } from "@/components/commerce/product-purchase";
import type { Product, ProductSize } from "@/data/products";

export function ProductDetailHero({
  product,
  size,
}: {
  product: Product;
  size: ProductSize;
}) {
  const selectedImage = product.sizeImages[size.id] ?? product.image;
  return (
    <section className="product-detail-hero">
      <div className="fit-container product-detail-hero__grid">
        <div className={`product-detail-hero__visual${size.id === "4kg" ? " product-detail-hero__visual--packshot" : ""}`}>
          <Image
            src={selectedImage}
            alt={`${product.imageAlt} — ${size.label}`}
            width={760}
            height={980}
            priority
            sizes="(max-width: 900px) 90vw, 48vw"
          />
          <span dir="ltr">{size.label}</span>
        </div>
        <div className="product-detail-hero__copy">
          <Link className="back-link" href="/products">← كل المنتجات</Link>
          <p className="section-heading__kicker">{product.category}</p>
          <h1 dir="ltr">{product.name}</h1>
          <p className="product-detail-hero__action">
            {product.action} · <b dir="ltr">{size.label}</b>
          </p>
          <p className="product-detail-hero__description">{product.description}</p>
          <ProductPurchase product={product} size={size} />
          <div className="product-detail-hero__signals" aria-label="معلومات الطلب">
            <span><b>التوصيل</b> داخل مصر</span>
            <span><b>الدفع</b> حسب طرق الدفع المتاحة عند إتمام الطلب</span>
          </div>
        </div>
      </div>
    </section>
  );
}
