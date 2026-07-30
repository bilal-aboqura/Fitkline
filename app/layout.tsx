import type { Metadata } from "next";
import { Alexandria, Lalezar } from "next/font/google";
import { CartProvider } from "@/components/commerce/cart-provider";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getCmsContent } from "@/lib/cms-store";
import "./globals.css";

const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  variable: "--font-alexandria",
  display: "swap",
});

const lalezar = Lalezar({
  subsets: ["arabic", "latin"],
  weight: "400",
  variable: "--font-lalezar",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Fitkline | حلول نظافة للمنشآت الرياضية",
    template: "%s | Fitkline",
  },
  description: "حلول Fitkline للعناية بالجيمات والنوادي والمنشآت الرياضية.",
  applicationName: "Fitkline",
  keywords: ["Fitkline", "نظافة الجيم", "تنظيف أجهزة الجيم", "مصر"],
  openGraph: {
    type: "website",
    locale: "ar_EG",
    siteName: "Fitkline",
    title: "Fitkline | قوة المكان تبدأ من العناية به",
    description: "حلول عناية مخصصة للجيمات والنوادي والمنشآت الرياضية.",
    images: [{ url: "/images/fitkline-hero.png", width: 1600, height: 900 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fitkline | حلول نظافة للمنشآت الرياضية",
    description: "حلول عناية مخصصة للجيمات والنوادي والمنشآت الرياضية.",
    images: ["/images/fitkline-hero.png"],
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = await getCmsContent();

  return (
    <html lang="ar" dir="rtl">
      <body className={`${alexandria.variable} ${lalezar.variable}`}>
        <CartProvider>
          <a className="skip-link" href="#main-content">تخطّي إلى المحتوى</a>
          <SiteHeader settings={content.settings} links={content.navigation} />
          {children}
          <SiteFooter settings={content.settings} links={content.navigation} />
        </CartProvider>
      </body>
    </html>
  );
}
