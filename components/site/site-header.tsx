"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/commerce/cart-provider";
import { CampaignBanner } from "@/components/commerce/campaign-banner";
import type { SiteSettings } from "@/lib/cms-store";

export function SiteHeader({
  settings,
  links,
}: {
  settings: SiteSettings;
  links: Array<{ href: string; label: string }>;
}) {
  const [open, setOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <header className="site-header">
      <CampaignBanner />
      <div className="site-header__inner fit-container">
        <div className="site-header__brand-group">
          <Link className="site-logo" href="/" onClick={() => setOpen(false)} aria-label="Fitkline - الرئيسية">
            <Image
              className="site-logo__image"
              src={settings.logoUrl}
              alt={settings.siteName}
              width={1131}
              height={754}
              priority
            />
          </Link>
        </div>

        <nav id="main-navigation" className={`site-nav${open ? " is-open" : ""}`} aria-label="التنقل الرئيسي">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="site-header__actions">
          <Link className="site-header__quote" href="/contact">اطلب عرض سعر</Link>
          <Link className="site-cart-link" href="/cart" aria-label="السلة">
            <span aria-hidden="true">السلة</span>
            <span className="site-cart-link__count" aria-live="polite" suppressHydrationWarning>{itemCount}</span>
          </Link>
          <button
            className="site-menu-button"
            type="button"
            aria-expanded={open}
            aria-controls="main-navigation"
            onClick={() => setOpen((current) => !current)}
          >
            <span className="sr-only">فتح القائمة</span>
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
