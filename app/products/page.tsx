import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { formatProductPrice, getActiveProductVariants } from "@/data/products";
import { getCmsProducts } from "@/lib/cms-store";

export const metadata: Metadata = {
  title: "المنتجات",
  description:
    "تصفح حلول Fitkline للعناية بالجيمات والنوادي والمنشآت الرياضية.",
};

export default async function ProductsPage() {
  const products = await getCmsProducts();
  const variants = getActiveProductVariants(products);

  return (
    <main id="main-content" className="standard-page catalog-page--redesign">
      <section className="page-hero page-hero--redesign">
        <div className="fit-container page-hero__layout">
          <div className="page-hero__inner">
            <h1>
              اختار العبوة المناسبة
              <br />
              <span>لمكانك.</span>
            </h1>
            <p>
              كل عبوة 4 كجم و20 كجم ليها صفحة مستقلة بسعرها وصورتها وتوفرها،
              عشان توصل لاختيارك مباشرة.
            </p>
          </div>
        </div>
      </section>

      <section
        className="catalog-section catalog-section--redesign"
        aria-labelledby="catalog-title"
      >
        <div className="fit-container">
          <div className="catalog-intro">
            <div>
              <p className="section-heading__kicker">العبوات المتاحة</p>
              <h2 id="catalog-title">
                ثلاثة منتجات.
                <br />
                <span>عبوتان لكل منتج.</span>
              </h2>
            </div>
            <p>
              افتح صفحة العبوة المطلوبة مباشرة. أي سعر يتم تحديثه من لوحة الإدارة
              يظهر هنا وفي صفحة العبوة.
            </p>
          </div>
          <div className="catalog-grid catalog-grid--redesign">
            {variants.map(({ product, size, href, image, mobileOrder }) => (
              <article
                className="catalog-card catalog-card--redesign"
                key={`${product.slug}-${size.id}`}
                style={{ "--mobile-order": mobileOrder } as CSSProperties}
              >
                <div className="catalog-card__visual">
                  <Image
                    src={image}
                    alt={`${product.imageAlt} — ${size.label}`}
                    width={560}
                    height={720}
                    sizes="(max-width: 720px) 45vw, (max-width: 900px) 90vw, 30vw"
                  />
                </div>
                <div className="catalog-card__body">
                  <p className="catalog-card__category">{product.category}</p>
                  <div className="catalog-card__heading">
                    <h2 dir="ltr">{product.name}</h2>
                    <span dir="ltr">{size.label}</span>
                  </div>
                  <p>{product.shortDescription}</p>
                  <ul>
                    {product.benefits.map((benefit) => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                  <div className="catalog-card__bottom">
                    <strong>
                      {typeof size.price === "number"
                        ? formatProductPrice(size.price)
                        : product.priceLabel}
                    </strong>
                    <Link className="fit-button-primary" href={href}>
                      شوف عبوة {size.label}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
