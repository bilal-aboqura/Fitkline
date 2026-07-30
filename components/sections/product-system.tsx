import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import type { HomeContent } from "@/lib/cms-store";

type ProductSystemProps = {
  products: Product[];
  content: HomeContent["system"];
};

export function ProductSystem({ products, content }: ProductSystemProps) {
  return (
    <section
      className="product-system-redesign"
      id="product-system"
      aria-labelledby="product-system-title"
    >
      <div className="fit-container">
        <header className="product-system-redesign__header">
          <div>
            <p>{content.kicker}</p>
            <h2 id="product-system-title">
              {content.title} <span>{content.accent}</span>
            </h2>
          </div>
          <p className="product-system-redesign__intro">{content.description}</p>
        </header>

        <div className="product-system-redesign__list">
          {products.map((product, index) => (
            <article className="product-system-redesign__item" key={product.slug}>
              <div className="product-system-redesign__visual">
                <div className="product-system-redesign__visual-meta" dir="ltr">
                  <span>{product.step} / 03</span>
                  <span>4 KG · FITKLINE</span>
                </div>
                <Image
                  src={product.image}
                  alt={product.imageAlt}
                  width={1024}
                  height={1536}
                  sizes="(max-width: 760px) calc(100vw - 64px), 46vw"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>

              <div className="product-system-redesign__copy">
                <p className="product-system-redesign__name" dir="ltr">
                  {product.name}
                </p>
                <h3>{product.action}</h3>
                <p className="product-system-redesign__description">
                  {product.description}
                </p>
                <ul>
                  {product.benefits.slice(0, 2).map((benefit) => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                </ul>
                <div className="product-system-redesign__actions">
                  <Link className="fit-button-primary" href={`/products/${product.slug}`}>
                    تفاصيل المنتج
                  </Link>
                  <Link className="fit-button-secondary" href="/contact">
                    اطلب عرض سعر
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
