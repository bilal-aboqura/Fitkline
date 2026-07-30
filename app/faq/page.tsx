import type { Metadata } from "next";
import { getCmsContent } from "@/lib/cms-store";

export const metadata: Metadata = {
  title: "الأسئلة الشائعة",
  description: "إجابات Fitkline عن المنتجات والطلب والتوصيل داخل مصر.",
};

export default async function FAQPage() {
  const { pages } = await getCmsContent();
  const page = pages.faq;

  return (
    <main
      id="main-content"
      className="standard-page content-page--redesign faq-page--redesign"
    >
      <section className="page-hero page-hero--redesign page-hero--compact">
        <div className="fit-container page-hero__inner">
          <h1>
            {page.heroTitle}
            <br />
            <span>{page.heroAccent}</span>
          </h1>
          <p>{page.heroDescription}</p>
        </div>
      </section>
      <section className="content-section content-section--redesign">
        <div className="fit-container faq-list">
          {page.items.map((item, index) => (
            <details key={`${item.question}-${index}`}>
              <summary>
                {item.question}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
