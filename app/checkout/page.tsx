import type { Metadata } from "next";
import { CheckoutForm } from "@/components/commerce/checkout-form";
import { getCmsContent } from "@/lib/cms-store";
import { getKashierConfiguration } from "@/lib/kashier";
import { getShippingLocations } from "@/lib/shipping-store";

export const metadata: Metadata = { title: "تأكيد الطلب", description: "أرسل بياناتك لتأكيد طلب Fitkline." };

export default async function CheckoutPage() {
  const [content, shippingLocations] = await Promise.all([
    getCmsContent(),
    getShippingLocations(),
  ]);
  const kashier = getKashierConfiguration();

  return (
    <main id="main-content" className="standard-page commerce-page--redesign checkout-page--redesign">
      <section className="page-hero page-hero--redesign page-hero--compact"><div className="fit-container page-hero__inner"><p className="section-heading__kicker">الخطوة الأخيرة</p><h1>تأكيد الطلب.</h1><p>ابعت البيانات الأساسية، وفريقنا يؤكد السعر والتوافر قبل التنفيذ.</p></div></section>
      <section className="content-section content-section--redesign"><div className="fit-container"><CheckoutForm
        paymentOptions={{
          cod: content.settings.cashOnDeliveryEnabled,
          kashier: content.settings.kashierEnabled && kashier.ready,
        }}
        shippingLocations={shippingLocations}
      /></div></section>
    </main>
  );
}
