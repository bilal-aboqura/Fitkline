import { Hero } from "@/components/hero/hero";
import { PerformanceBenefits } from "@/components/sections/performance-benefits";
import { ProductDirectory } from "@/components/sections/product-directory";
import { FacilityRoutine } from "@/components/sections/facility-routine";
import { QuoteBanner } from "@/components/sections/quote-banner";
import { getCmsContent } from "@/lib/cms-store";

export default async function HomePage() {
  const content = await getCmsContent();
  const products = content.products.filter((product) => product.active);

  return (
    <main id="main-content">
      <Hero scenes={content.home.heroScenes} />
      <ProductDirectory products={products} content={content.home.directory} />
      <PerformanceBenefits content={content.home.benefits} />
      <FacilityRoutine />
      <QuoteBanner content={content.home.quote} />
    </main>
  );
}
