import Link from "next/link";
import type { HomeContent } from "@/lib/cms-store";

export function QuoteBanner({ content }: { content: HomeContent["quote"] }) {
  return (
    <section className="quote-banner quote-banner--redesign" aria-labelledby="quote-banner-title">
      <div className="fit-container quote-banner__inner">
        <div className="quote-banner__signal" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="quote-banner__copy">
          <p className="quote-banner__kicker">{content.kicker}</p>
          <h2 id="quote-banner-title">{content.title}<br /><span>{content.accent}</span></h2>
          <p>{content.description}</p>
        </div>
        <div className="quote-banner__action">
          <Link className="fit-button-primary" href="/contact">اتكلم مع الفريق <span aria-hidden="true">←</span></Link>
          <span>جيم · نادي · استوديو · صالة</span>
        </div>
      </div>
    </section>
  );
}
