import Link from "next/link";
import { getCmsContent } from "@/lib/cms-store";
import { getOrders } from "@/lib/order-store";
import { getKashierConfiguration } from "@/lib/kashier";
import { getSupabaseConfiguration } from "@/lib/supabase-server";
import { getAnalyticsSummary } from "@/lib/analytics-store";
import { getBostaConfiguration } from "@/lib/bosta";

export const metadata = { title: "نظرة عامة" };

export default async function AdminDashboardPage() {
  const [content, orders, analytics] = await Promise.all([
    getCmsContent(),
    getOrders(),
    getAnalyticsSummary(7),
  ]);
  const paidKashierOrders = orders.filter(
    (order) =>
      order.paymentMethod === "kashier" && order.paymentStatus === "paid",
  );
  const openOrders = orders.filter(
    (order) => !["completed", "cancelled"].includes(order.orderStatus),
  );
  const kashierRevenue = paidKashierOrders.reduce(
    (total, order) => total + (order.total ?? 0),
    0,
  );
  const kashier = getKashierConfiguration();
  const supabase = getSupabaseConfiguration();
  const bosta = getBostaConfiguration();
  const todayVisitors = analytics.daily.at(-1)?.visitors ?? 0;

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
        <article><span>تحصيل كاشير</span><strong dir="ltr">{kashierRevenue.toLocaleString("en-US")}</strong><small>جنيه مصري مدفوع ومسجل</small></article>
        <article><span>زوار اليوم</span><strong>{todayVisitors}</strong><small>{analytics.available ? "متصفحات فريدة تقريبًا" : "فعّل قاعدة بيانات التحليلات"}</small></article>
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
            <div><dt>Supabase</dt><dd className={supabase.ready ? "is-good" : "is-warning"}>{supabase.ready ? "متصل" : "يحتاج إعداد"}</dd></div>
            <div><dt>الكتالوج</dt><dd className="is-good">{content.products.length} منتجات</dd></div>
            <div><dt>الدفع عند الاستلام</dt><dd className={content.settings.cashOnDeliveryEnabled ? "is-good" : ""}>{content.settings.cashOnDeliveryEnabled ? "مفعّل" : "متوقف"}</dd></div>
            <div><dt>كاشير</dt><dd className={kashier.ready && content.settings.kashierEnabled ? "is-good" : "is-warning"}>{kashier.ready && content.settings.kashierEnabled ? "جاهز" : "يحتاج إعداد"}</dd></div>
            <div><dt>بوسطة</dt><dd className={bosta.ready ? "is-good" : "is-warning"}>{bosta.ready ? "متصل" : "يحتاج إعداد"}</dd></div>
          </dl>
          <Link className="admin-secondary-action" href="/admin/settings">راجع إعدادات الدفع</Link>
        </aside>
      </div>
    </>
  );
}
