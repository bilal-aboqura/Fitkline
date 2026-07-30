import Image from "next/image";
import Link from "next/link";
import type { SiteSettings } from "@/lib/cms-store";

export function SiteFooter({
  settings,
  links,
}: {
  settings: SiteSettings;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner fit-container">
        <div>
          <Link className="site-logo" href="/" aria-label="Fitkline - الرئيسية">
            <Image
              className="site-logo__image"
              src={settings.logoUrl}
              alt={settings.siteName}
              width={1131}
              height={754}
            />
          </Link>
          <p className="site-footer__tagline">{settings.tagline}</p>
        </div>
        <div className="site-footer__links">
          {links.map((link) => (
            <Link href={link.href} key={link.href}>{link.label}</Link>
          ))}
          <Link href="/legal/privacy">الخصوصية</Link>
          <Link href="/legal/terms">الشروط</Link>
        </div>
        <p className="site-footer__note">{settings.shippingNote} — السعر والتوفر يتم تأكيدهما قبل تنفيذ الطلب.</p>
      </div>
    </footer>
  );
}
