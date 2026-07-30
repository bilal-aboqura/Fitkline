import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCmsProducts } from "@/lib/cms-store";

export const metadata: Metadata = {
  title: "المنتجات",
  description:
    "تصفح حلول Fitkline للعناية بالجيمات والنوادي والمنشآت الرياضية.",
};

export default async function ProductsPage() {
  const products = await getCmsProducts();

  return (
    <main id="main-content" className="standard-page catalog-page--redesign">
      <section className="page-hero page-hero--redesign">
        <div className="fit-container page-hero__layout">
          <div className="page-hero__inner">
            <h1>
              اختار الحل المناسب
              <br />
              <span>لمكانك.</span>
            </h1>
            <p>
              من الأجهزة للأرضيات والرائحة العامة، كل منتج له دور واضح داخل
              روتين العناية بالمنشأة الرياضية.
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
              <p className="section-heading__kicker">نقاط البداية</p>
              <h2 id="catalog-title">
                ثلاثة أدوار.
                <br />
                <span>منظومة واحدة.</span>
              </h2>
            </div>
            <p>
              الأحجام المعروضة: 4 كجم و20 كجم. السعر والتوافر يتأكدوا
              حسب الكمية وطريقة الاستخدام.
            </p>
          </div>
          <div className="catalog-grid catalog-grid--redesign">
            {products.map((product) => (
              <article
                className="catalog-card catalog-card--redesign"
                key={product.slug}
              >
                <div className="catalog-card__visual">
                  <div className="catalog-card__meta" dir="ltr">
                    <span>{product.step} / 03</span>
                    <span>FITKLINE</span>
                  </div>
                  <Image
                    src={product.catalogImage}
                    alt={product.imageAlt}
                    width={560}
                    height={720}
                    sizes="(max-width: 760px) 90vw, 30vw"
                  />
                </div>
                <div className="catalog-card__body">
                  <p className="catalog-card__category">{product.category}</p>
                  <div className="catalog-card__heading">
                    <h2 dir="ltr">{product.name}</h2>
                    <span>{product.action}</span>
                  </div>
                  <p>{product.shortDescription}</p>
                  <ul>
                    {product.benefits.map((benefit) => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                  <div className="catalog-card__bottom">
                    <span>4 كجم · 20 كجم</span>
                    <Link
                      className="fit-button-primary"
                      href={`/products/${product.slug}`}
                    >
                      شوف التفاصيل
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
