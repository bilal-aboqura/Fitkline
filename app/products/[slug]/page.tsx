import { notFound, redirect } from "next/navigation";
import { getProductVariantHref } from "@/data/products";
import { getCmsProduct, getCmsProducts } from "@/lib/cms-store";

export async function generateStaticParams() {
  const products = await getCmsProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductFamilyRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getCmsProduct(slug);
  if (!product) notFound();

  const firstSize = product.sizes.find((size) => size.active);
  if (!firstSize) notFound();

  redirect(getProductVariantHref(product.slug, firstSize.id));
}
