import Link from "next/link";

export default function NotFound() {
  return <main id="main-content" className="standard-page"><section className="page-hero page-hero--compact"><div className="fit-container page-hero__inner"><p className="section-heading__kicker">404 / خارج المسار</p><h1>الصفحة<br /><span>مش موجودة.</span></h1><p>ارجع للمنتجات أو ابدأ من الصفحة الرئيسية.</p><div className="page-actions"><Link className="fit-button-primary" href="/products">المنتجات</Link><Link className="fit-button-secondary" href="/">الرئيسية</Link></div></div></section></main>;
}

