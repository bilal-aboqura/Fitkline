import { Hero } from "@/components/hero/hero";
import { PerformanceBenefits } from "@/components/sections/performance-benefits";
import { ProductDirectory } from "@/components/sections/product-directory";
import { FacilityRoutine } from "@/components/sections/facility-routine";
import { QuoteBanner } from "@/components/sections/quote-banner";
import { OffersShowcase } from "@/components/sections/offers-showcase";
import { isOfferPublic } from "@/data/offers";
import { getCmsContent } from "@/lib/cms-store";

export default async function HomePage() {
  const content = await getCmsContent();
  const products = content.products.filter((product) => product.active);
  const offers = content.offers
    .filter((offer) => isOfferPublic(offer))
    .filter((offer) => offer.showOnHomepage)
    .filter((offer) => offer.items.every((item) => products.some((product) => product.slug === item.slug && product.sizes.some((size) => size.id === item.sizeId && size.active))))
    .sort((a, b) => a.priority - b.priority);

  return (
    <main id="main-content">
      <Hero scenes={content.home.heroScenes} />
      <OffersShowcase offers={offers} products={products} />
      <ProductDirectory products={products} content={content.home.directory} />
      <PerformanceBenefits content={content.home.benefits} />
      <FacilityRoutine />
      <QuoteBanner content={content.home.quote} />
    </main>
  );
}
