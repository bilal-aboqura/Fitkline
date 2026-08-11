import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailPageContent } from "@/components/sections/product-detail-page";
import { getActiveProductVariants } from "@/data/products";
import { getCmsProductVariant, getCmsProducts } from "@/lib/cms-store";

export async function generateStaticParams() {
  const products = await getCmsProducts();
  return getActiveProductVariants(products).map(({ product, size }) => ({
    slug: product.slug,
    size: size.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; size: string }>;
}): Promise<Metadata> {
  const { slug, size } = await params;
  const variant = await getCmsProductVariant(slug, size);
  if (!variant) return { title: "المنتج غير موجود" };

  const image =
    variant.product.sizeImages[variant.size.id] ?? variant.product.image;

  return {
    title: `${variant.product.name} ${variant.size.label}`,
    description: variant.product.shortDescription,
    openGraph: { images: [image] },
  };
}

export default async function ProductVariantPage({
  params,
}: {
  params: Promise<{ slug: string; size: string }>;
}) {
  const { slug, size } = await params;
  const variant = await getCmsProductVariant(slug, size);
  if (!variant) notFound();

  return (
    <ProductDetailPageContent
      product={variant.product}
      size={variant.size}
    />
  );
}
