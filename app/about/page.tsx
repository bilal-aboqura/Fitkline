import type { Metadata } from "next";
import Link from "next/link";
import { getCmsContent } from "@/lib/cms-store";

export const metadata: Metadata = {
  title: "عن Fitkline",
  description: "اعرف لماذا صممت Fitkline للعناية بالمنشآت الرياضية.",
};

export default async function AboutPage() {
  const { pages } = await getCmsContent();
  const page = pages.about;

  return (
    <main
      id="main-content"
      className="standard-page content-page--redesign about-page--redesign"
    >
      <section className="page-hero page-hero--redesign">
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
        <div className="fit-container editorial-layout">
          <div className="section-heading">
            <p className="section-heading__kicker">{page.kicker}</p>
            <h2>{page.sectionTitle}</h2>
          </div>
          <div className="editorial-copy">
            {page.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <Link className="fit-button-primary" href="/contact">
              {page.ctaLabel}
            </Link>
          </div>
        </div>
      </section>
      <section className="principles-section principles-section--redesign">
        <div className="fit-container">
          <div className="principles-grid">
            {page.principles.map((principle, index) => (
              <article key={`${principle.title}-${index}`}>
                <span dir="ltr">{String(index + 1).padStart(2, "0")}</span>
                <h2>{principle.title}</h2>
                <p>{principle.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
