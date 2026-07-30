import type { Metadata } from "next";
import { CartView } from "@/components/commerce/cart-view";

export const metadata: Metadata = { title: "السلة", description: "راجع منتجات وأحجام طلب Fitkline." };

export default function CartPage() {
  return (
    <main id="main-content" className="standard-page commerce-page--redesign cart-page--redesign">
      <section className="page-hero page-hero--redesign page-hero--compact"><div className="fit-container page-hero__inner"><p className="section-heading__kicker">طلبك</p><h1>السلة.</h1><p>راجع اختياراتك قبل إرسال طلب التأكيد.</p></div></section>
      <section className="content-section content-section--redesign"><div className="fit-container"><CartView /></div></section>
    </main>
  );
}
