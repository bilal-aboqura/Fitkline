import type { MetadataRoute } from "next";
import { getActiveProductVariants } from "@/data/products";
import { getCmsProducts } from "@/lib/cms-store";
import { getSiteOrigin } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getCmsProducts();
  const variants = getActiveProductVariants(products);
  const baseUrl = getSiteOrigin();
  const routes = ["", "/products", "/about", "/faq", "/contact", "/cart", "/checkout", "/legal/privacy", "/legal/terms"];
  return [
    ...routes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
    })),
    ...variants.map((variant) => ({
      url: `${baseUrl}${variant.href}`,
      lastModified: new Date(),
    })),
  ];
}
