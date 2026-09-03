import { AdminOffersManager } from "@/components/admin/admin-offers-manager";
import { getCmsContent } from "@/lib/cms-store";

export default async function AdminOffersPage() {
  const content = await getCmsContent();
  return <AdminOffersManager initialOffers={content.offers} products={content.products} />;
}
