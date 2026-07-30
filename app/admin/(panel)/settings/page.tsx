import Link from "next/link";
import { getCmsContent } from "@/lib/cms-store";
import { getKashierConfiguration } from "@/lib/kashier";

export const metadata = { title: "الإعدادات والدفع" };

export default async function AdminSettingsPage() {
  const [content, kashier] = await Promise.all([
    getCmsContent(),
    Promise.resolve(getKashierConfiguration()),
  ]);
  const checks = [
    { label: "Merchant ID", ready: Boolean(kashier.merchantId) },
    { label: "API Key", ready: Boolean(kashier.apiKey) },
    { label: "Secret Key", ready: Boolean(kashier.secretKey) },
    { label: "رابط الموقع العام", ready: Boolean(process.env.NEXT_PUBLIC_SITE_URL) },
  ];

  return (
    <>
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">التشغيل الآمن</p>
          <h1>الإعدادات والدفع</h1>
          <p>حالة بوابة كاشير وخيارات الطلب العامة من غير عرض أي مفاتيح سرية.</p>
        </div>
      </header>

      <div className="admin-settings-grid">
        <section className="admin-panel admin-payment-panel">
          <div className="admin-panel__header">
            <div><p className="admin-eyebrow">KASHIER PAYMENT SESSIONS</p><h2>الدفع الإلكتروني</h2></div>
            <span className={`admin-connection${kashier.ready ? " is-ready" : ""}`}>{kashier.ready ? "متصل" : "غير مكتمل"}</span>
          </div>
          <p>العميل ينتقل إلى صفحة دفع مستضافة من كاشير. بيانات البطاقة لا تدخل سيرفر Fitkline ولا تُخزّن في الطلبات.</p>
          <dl>
            {checks.map((check) => <div key={check.label}><dt>{check.label}</dt><dd className={check.ready ? "is-good" : "is-warning"}>{check.ready ? "جاهز" : "ناقص"}</dd></div>)}
            <div><dt>الوضع</dt><dd>{kashier.mode === "live" ? "Live" : "Test"}</dd></div>
            <div><dt>حالة العرض بالموقع</dt><dd>{content.settings.kashierEnabled ? "مفعّل" : "متوقف من المحتوى"}</dd></div>
          </dl>
          {!kashier.ready ? (
            <div className="admin-alert admin-alert--warning">
              أضف KASHIER_MERCHANT_ID وKASHIER_API_KEY وKASHIER_SECRET_KEY في متغيرات البيئة، ثم أعد تشغيل الموقع.
            </div>
          ) : null}
        </section>

        <section className="admin-panel admin-payment-panel">
          <div className="admin-panel__header"><div><p className="admin-eyebrow">سياسة الطلب</p><h2>طرق الدفع المتاحة</h2></div></div>
          <dl>
            <div><dt>الدفع عند الاستلام</dt><dd className={content.settings.cashOnDeliveryEnabled ? "is-good" : ""}>{content.settings.cashOnDeliveryEnabled ? "مفعّل" : "متوقف"}</dd></div>
            <div><dt>كاشير</dt><dd className={content.settings.kashierEnabled ? "is-good" : ""}>{content.settings.kashierEnabled ? "مفعّل" : "متوقف"}</dd></div>
            <div><dt>العملة</dt><dd>{content.settings.currency}</dd></div>
            <div><dt>الشحن</dt><dd>{content.settings.shippingNote}</dd></div>
          </dl>
          <p>يمكنك تغيير مفاتيح العرض العامة من مستند محتوى الموقع. المفاتيح السرية تظل في البيئة فقط.</p>
          <Link className="admin-secondary-action" href="/admin/content">افتح إعدادات المحتوى</Link>
        </section>
      </div>
    </>
  );
}

