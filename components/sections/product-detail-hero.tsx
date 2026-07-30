"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ProductPurchase } from "@/components/commerce/product-purchase";
import type { Product, ProductSize } from "@/data/products";

export function ProductDetailHero({ product }: { product: Product }) {
  const [selectedSize, setSelectedSize] = useState<ProductSize>(product.sizes[0]);
  const selectedImage = product.sizeImages[selectedSize.id] ?? product.image;

  return (
    <section className="product-detail-hero">
      <div className="fit-container product-detail-hero__grid">
        <div className={`product-detail-hero__visual${selectedSize.id === "4kg" ? " product-detail-hero__visual--packshot" : ""}`}>
          <Image
            key={selectedImage}
            src={selectedImage}
            alt={`${product.imageAlt} — ${selectedSize.label}`}
            width={760}
            height={980}
            priority
            sizes="(max-width: 900px) 90vw, 48vw"
          />
          <span dir="ltr">{product.step} / 03</span>
        </div>
        <div className="product-detail-hero__copy">
          <Link className="back-link" href="/products">← كل المنتجات</Link>
          <p className="section-heading__kicker">{product.category}</p>
          <h1 dir="ltr">{product.name}</h1>
          <p className="product-detail-hero__action">{product.action}</p>
          <p className="product-detail-hero__description">{product.description}</p>
          <ProductPurchase product={product} selectedSize={selectedSize} onSizeChange={setSelectedSize} />
          <div className="product-detail-hero__signals" aria-label="معلومات الطلب">
            <span><b>التوفر</b> قيد التأكيد</span>
            <span><b>التوصيل</b> داخل مصر</span>
            <span><b>الدفع</b> يتم تأكيده مع الفريق</span>
          </div>
        </div>
      </div>
    </section>
  );
}
