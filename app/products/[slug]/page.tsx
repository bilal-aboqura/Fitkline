import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetailHero } from "@/components/sections/product-detail-hero";
import { getCmsProduct, getCmsProducts } from "@/lib/cms-store";

export async function generateStaticParams() {
  const products = await getCmsProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCmsProduct(slug);
  if (!product) return { title: "المنتج غير موجود" };
  return { title: product.name, description: product.shortDescription, openGraph: { images: [product.image] } };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getCmsProduct(slug);
  if (!product) notFound();

  return (
    <main id="main-content" className="standard-page product-detail-page product-detail-page--redesign">
      <ProductDetailHero product={product} />

      <section className="detail-section detail-section--redesign" aria-labelledby="benefits-title">
        <div className="fit-container detail-section__grid">
          <div className="section-heading">
            <p className="section-heading__kicker">ليه المنتج ده</p>
            <h2 id="benefits-title">دور واضح داخل روتين المكان.</h2>
          </div>
          <ul className="detail-list">{product.benefits.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </section>

      <section className="detail-section detail-section--dark detail-section--redesign" aria-labelledby="use-cases-title">
        <div className="fit-container detail-section__grid">
          <div className="section-heading">
            <p className="section-heading__kicker">مناسب لـ</p>
            <h2 id="use-cases-title">استخدامات رياضية حقيقية.</h2>
          </div>
          <ul className="detail-list">{product.useCases.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </section>

      <section className="detail-section detail-section--redesign" aria-labelledby="how-title">
        <div className="fit-container detail-section__grid detail-section__grid--three">
          <div className="section-heading"><p className="section-heading__kicker">قبل التشغيل</p><h2 id="how-title">طريقة الاستخدام.</h2></div>
          <ol className="detail-list detail-list--ordered">{product.howToUse.map((item) => <li key={item}>{item}</li>)}</ol>
          <div className="detail-callout"><strong>مهم</strong><p>اتبع دائمًا تعليمات العبوة وتأكد من توافق المنتج مع السطح وطريقة التشغيل في مكانك.</p></div>
        </div>
      </section>

      <section className="detail-section detail-section--dark detail-section--redesign" aria-labelledby="safety-title">
        <div className="fit-container detail-section__grid">
          <div className="section-heading"><p className="section-heading__kicker">التخزين والسلامة</p><h2 id="safety-title">تشغيل مسؤول.</h2></div>
          <ul className="detail-list">{product.safety.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </section>

      <div className="mobile-purchase-bar"><Link className="fit-button-primary" href="#purchase-panel">اختار الحجم واطلب</Link></div>
    </main>
  );
}
