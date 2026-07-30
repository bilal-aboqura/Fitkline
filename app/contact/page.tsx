import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/contact-form";
import { getCmsContent } from "@/lib/cms-store";

export const metadata: Metadata = {
  title: "تواصل معنا",
  description: "اطلب عرض سعر أو مساعدة لاختيار حلول Fitkline المناسبة لمنشأتك.",
};

export default async function ContactPage() {
  const { pages } = await getCmsContent();
  const page = pages.contact;

  return (
    <main
      id="main-content"
      className="standard-page content-page--redesign contact-page--redesign"
    >
      <section className="page-hero page-hero--redesign page-hero--split">
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
        <div className="fit-container contact-layout">
          <div className="contact-intro">
            <p className="section-heading__kicker">{page.kicker}</p>
            <h2>{page.sectionTitle}</h2>
            <p>{page.intro}</p>
            <div className="contact-page__notes">
              {page.notes.map((note) => (
                <span key={note}>{note}</span>
              ))}
            </div>
          </div>
          <ContactForm content={page.form} />
        </div>
      </section>
    </main>
  );
}
