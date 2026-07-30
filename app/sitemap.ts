import type { MetadataRoute } from "next";
import { getCmsProducts } from "@/lib/cms-store";
import { getSiteOrigin } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getCmsProducts();
  const baseUrl = getSiteOrigin();
  const routes = ["", "/products", "/about", "/faq", "/contact", "/cart", "/checkout", "/legal/privacy", "/legal/terms"];
  return [...routes.map((route) => ({ url: `${baseUrl}${route}`, lastModified: new Date() })), ...products.map((product) => ({ url: `${baseUrl}/products/${product.slug}`, lastModified: new Date() }))];
}
