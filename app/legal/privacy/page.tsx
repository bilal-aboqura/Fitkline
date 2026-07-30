import type { Metadata } from "next";
import { getCmsContent } from "@/lib/cms-store";

export const metadata: Metadata = { title: "سياسة الخصوصية" };

export default async function PrivacyPage() {
  const { pages } = await getCmsContent();
  const page = pages.privacy;

  return (
    <main id="main-content" className="standard-page content-page--redesign legal-page--redesign">
      <section className="page-hero page-hero--redesign page-hero--compact"><div className="fit-container page-hero__inner"><p className="section-heading__kicker">{page.kicker}</p><h1>{page.title}</h1></div></section>
      <section className="content-section content-section--redesign legal-copy"><div className="fit-container">{page.sections.map((section, index) => <div key={`${section.title}-${index}`}><h2>{section.title}</h2><p>{section.body}</p></div>)}</div></section>
    </main>
  );
}
