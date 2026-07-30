import type { MetadataRoute } from "next";
import { getCmsProducts } from "@/lib/cms-store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getCmsProducts();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const routes = ["", "/products", "/about", "/faq", "/contact", "/cart", "/checkout", "/legal/privacy", "/legal/terms"];
  return [...routes.map((route) => ({ url: `${baseUrl}${route}`, lastModified: new Date() })), ...products.map((product) => ({ url: `${baseUrl}/products/${product.slug}`, lastModified: new Date() }))];
}
