import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import type { HomeContent } from "@/lib/cms-store";

export function ProductDirectory({
  products,
  content,
}: {
  products: Product[];
  content: HomeContent["directory"];
}) {
  return (
    <section className="product-directory product-directory--redesign" aria-labelledby="product-directory-title">
      <div className="fit-container">
        <div className="product-directory__intro">
          <div>
            <p className="product-directory__kicker">{content.kicker}</p>
            <h2 id="product-directory-title">
              {content.title}<br />
              <span>{content.accent}</span>
            </h2>
          </div>
          <p className="product-directory__lead">
            {content.lead}
          </p>
        </div>

        <div className="product-directory__grid">
          {products.map((product, index) => (
            <article className="product-card product-card--editorial" key={product.slug}>
              <div className="product-card__visual">
                <div className="product-card__visual-meta" dir="ltr">
                  <span>{product.step} / 03</span>
                  <span>{index === 0 ? "START HERE" : "FITKLINE SYSTEM"}</span>
                </div>
                <Image
                  src={product.image}
                  alt={product.imageAlt}
                  width={560}
                  height={720}
                  sizes="(max-width: 760px) 90vw, (max-width: 1100px) 44vw, 31vw"
                />
              </div>

              <div className="product-card__body">
                <div className="product-card__heading">
                  <div>
                    <p className="product-card__category">{product.category}</p>
                    <h3 dir="ltr">{product.name}</h3>
                  </div>
                  <span className="product-card__action">{product.action}</span>
                </div>

                <p className="product-card__description">{product.shortDescription}</p>

                <ul className="product-card__benefits">
                  {product.benefits.slice(0, 2).map((benefit) => <li key={benefit}>{benefit}</li>)}
                </ul>

                <div className="product-card__sizes" aria-label="الأحجام المتاحة">
                  <span>الأحجام</span>
                  <div dir="ltr">
                    {product.sizes.map((size) => <b key={size.id}>{size.label}</b>)}
                  </div>
                </div>

                <div className="product-card__footer">
                  <Link className="fit-button-primary" href={`/products/${product.slug}`}>شوف التفاصيل</Link>
                  <Link className="product-card__text-link" href="/contact">اطلب عرض سعر <span aria-hidden="true">←</span></Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="product-directory__base-line">
          <span>السعر والتوافر بيتأكدوا حسب الكمية والمساحة.</span>
          <Link href="/products">استكشف المنظومة كاملة <span aria-hidden="true">←</span></Link>
        </div>
      </div>
    </section>
  );
}
