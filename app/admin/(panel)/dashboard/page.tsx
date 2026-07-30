import Link from "next/link";
import { getCmsContent } from "@/lib/cms-store";
import { getOrders } from "@/lib/order-store";
import { getKashierConfiguration } from "@/lib/kashier";

export const metadata = { title: "نظرة عامة" };

export default async function AdminDashboardPage() {
  const [content, orders] = await Promise.all([getCmsContent(), getOrders()]);
  const paidOrders = orders.filter((order) => order.paymentStatus === "paid");
  const openOrders = orders.filter(
    (order) => !["completed", "cancelled"].includes(order.orderStatus),
  );
  const revenue = paidOrders.reduce((total, order) => total + (order.subtotal ?? 0), 0);
  const kashier = getKashierConfiguration();

  return (
    <>
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">اليوم في Fitkline</p>
          <h1>نظرة عامة</h1>
          <p>ملخص مباشر للمحتوى، الكتالوج، والطلبات.</p>
        </div>
        <Link className="admin-primary-action" href="/admin/content">عدّل الموقع</Link>
      </header>

      <section className="admin-metrics" aria-label="ملخص الأداء">
        <article><span>إجمالي الطلبات</span><strong>{orders.length}</strong><small>من أول تشغيل الداشبورد</small></article>
        <article><span>طلبات مفتوحة</span><strong>{openOrders.length}</strong><small>تحتاج متابعة أو تنفيذ</small></article>
        <article><span>تحصيل كاشير</span><strong dir="ltr">{revenue.toLocaleString("en-US")}</strong><small>جنيه مصري مدفوع ومسجل</small></article>
        <article><span>المنتجات النشطة</span><strong>{content.products.filter((p) => p.active).length}</strong><small>من أصل {content.products.length} منتجات</small></article>
      </section>

      <div className="admin-dashboard-grid">
        <section className="admin-panel">
          <div className="admin-panel__header">
            <div><p className="admin-eyebrow">آخر النشاط</p><h2>أحدث الطلبات</h2></div>
            <Link href="/admin/orders">كل الطلبات</Link>
          </div>
          {orders.length ? (
            <div className="admin-compact-list">
              {orders.slice(0, 5).map((order) => (
                <Link href="/admin/orders" key={order.reference}>
                  <span><b dir="ltr">{order.reference}</b><small>{order.customer.name}</small></span>
                  <span><b>{order.orderStatus}</b><small>{new Date(order.createdAt).toLocaleDateString("ar-EG")}</small></span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="admin-empty"><h3>لسه مفيش طلبات.</h3><p>أول طلب من المتجر هيظهر هنا تلقائيًا.</p></div>
          )}
        </section>

        <aside className="admin-panel admin-status-panel">
          <div className="admin-panel__header"><div><p className="admin-eyebrow">جاهزية التشغيل</p><h2>حالة النظام</h2></div></div>
          <dl>
            <div><dt>المحتوى</dt><dd className="is-good">متصل</dd></div>
            <div><dt>الكتالوج</dt><dd className="is-good">{content.products.length} منتجات</dd></div>
            <div><dt>الدفع عند الاستلام</dt><dd className={content.settings.cashOnDeliveryEnabled ? "is-good" : ""}>{content.settings.cashOnDeliveryEnabled ? "مفعّل" : "متوقف"}</dd></div>
            <div><dt>كاشير</dt><dd className={kashier.ready && content.settings.kashierEnabled ? "is-good" : "is-warning"}>{kashier.ready && content.settings.kashierEnabled ? "جاهز" : "يحتاج إعداد"}</dd></div>
          </dl>
          <Link className="admin-secondary-action" href="/admin/settings">راجع إعدادات الدفع</Link>
        </aside>
      </div>
    </>
  );
}
