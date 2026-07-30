import { AdminShippingManager } from "@/components/admin/admin-shipping-manager";
import { getShippingLocations } from "@/lib/shipping-store";

export const metadata = { title: "المحافظات والشحن" };

export default async function AdminShippingPage() {
  const locations = await getShippingLocations({ includeInactive: true });
  const cityCount = locations.reduce(
    (total, governorate) => total + governorate.cities.length,
    0,
  );

  return (
    <>
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">EGYPT DELIVERY CONTROL</p>
          <h1>المحافظات والمدن والشحن</h1>
          <p>
            حدد سعرًا عامًا لكل محافظة، أو سعرًا خاصًا لمدينة بعينها.{" "}
            {locations.length} محافظة و{cityCount} مدينة ومنطقة جاهزة.
          </p>
        </div>
      </header>
      <AdminShippingManager initialLocations={locations} />
    </>
  );
}
