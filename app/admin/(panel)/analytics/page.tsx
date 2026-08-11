import Link from "next/link";
import {
  getAnalyticsSummary,
  type AnalyticsDailyPoint,
} from "@/lib/analytics-store";

export const metadata = { title: "التحليلات والزوار" };
export const dynamic = "force-dynamic";

const numberFormatter = new Intl.NumberFormat("ar-EG");
const decimalFormatter = new Intl.NumberFormat("ar-EG", {
  maximumFractionDigits: 1,
});

function comparison(current: number, previous: number) {
  if (previous === 0) return current > 0 ? { label: "بيانات جديدة", state: "up" } : null;
  const change = ((current - previous) / previous) * 100;
  return {
    label: `${change >= 0 ? "+" : ""}${decimalFormatter.format(change)}٪ عن الفترة السابقة`,
    state: change >= 0 ? "up" : "down",
  };
}

function pageLabel(path: string) {
  if (path === "/") return "الصفحة الرئيسية";
  if (path === "/products") return "كل المنتجات";
  if (path.startsWith("/products/")) return "صفحة منتج";
  if (path === "/cart") return "سلة المشتريات";
  if (path === "/checkout") return "إتمام الطلب";
  if (path === "/contact") return "تواصل معنا";
  if (path === "/about") return "عن Fitkline";
  if (path === "/faq") return "الأسئلة الشائعة";
  return "صفحة بالموقع";
}

function sourceLabel(source: string) {
  if (source === "direct") return "زيارة مباشرة";
  if (source.toLowerCase().includes("google")) return "Google";
  if (source.toLowerCase().includes("facebook")) return "Facebook";
  if (source.toLowerCase().includes("instagram")) return "Instagram";
  return source;
}

function AnalyticsChart({ points }: { points: AnalyticsDailyPoint[] }) {
  const width = 900;
  const height = 260;
  const padding = 24;
  const max = Math.max(1, ...points.flatMap((point) => [point.visitors, point.pageViews]));
  const x = (index: number) =>
    padding + (index / Math.max(1, points.length - 1)) * (width - padding * 2);
  const y = (value: number) => height - padding - (value / max) * (height - padding * 2);
  const visitorsLine = points.map((point, index) => `${x(index)},${y(point.visitors)}`).join(" ");
  const viewsLine = points.map((point, index) => `${x(index)},${y(point.pageViews)}`).join(" ");
  const labelIndexes = Array.from(new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]));

  return (
    <div className="admin-analytics-chart">
      <svg
        role="img"
        aria-label="رسم يومي لعدد الزوار ومشاهدات الصفحات"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            className="admin-chart-gridline"
            key={ratio}
            x1={padding}
            x2={width - padding}
            y1={padding + (height - padding * 2) * ratio}
            y2={padding + (height - padding * 2) * ratio}
          />
        ))}
        {points.length > 0 ? (
          <>
            <polyline className="admin-chart-line admin-chart-line--views" points={viewsLine} />
            <polyline className="admin-chart-line admin-chart-line--visitors" points={visitorsLine} />
            {points.map((point, index) => (
              <circle
                className="admin-chart-point"
                cx={x(index)}
                cy={y(point.visitors)}
                key={point.date}
                r="3.5"
              >
                <title>{`${new Date(`${point.date}T12:00:00`).toLocaleDateString("ar-EG")}: ${point.visitors} زائر، ${point.pageViews} مشاهدة`}</title>
              </circle>
            ))}
          </>
        ) : null}
      </svg>
      {points.length > 0 ? (
        <div className="admin-chart-labels" aria-hidden="true">
          {labelIndexes.map((index) => (
            <span key={points[index].date}>
              {new Date(`${points[index].date}T12:00:00`).toLocaleDateString("ar-EG", {
                day: "numeric",
                month: "short",
              })}
            </span>
          ))}
        </div>
      ) : null}
      <table className="admin-visually-hidden">
        <caption>الزوار ومشاهدات الصفحات يوميًا</caption>
        <thead><tr><th>التاريخ</th><th>الزوار</th><th>المشاهدات</th></tr></thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.date}><td>{point.date}</td><td>{point.visitors}</td><td>{point.pageViews}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const requestedPeriod = Number(params.period);
  const period = [7, 30, 90].includes(requestedPeriod) ? requestedPeriod : 30;
  const analytics = await getAnalyticsSummary(period);
  const visitorsComparison = comparison(
    analytics.totals.visitors,
    analytics.totals.previousVisitors,
  );
  const viewsComparison = comparison(
    analytics.totals.pageViews,
    analytics.totals.previousPageViews,
  );
  const returningRate = analytics.totals.visitors
    ? (analytics.totals.returningVisitors / analytics.totals.visitors) * 100
    : 0;
  const singlePageRate = analytics.totals.sessions
    ? (analytics.totals.singlePageSessions / analytics.totals.sessions) * 100
    : 0;
  const sourceMaximum = Math.max(1, ...analytics.sources.map((source) => source.sessions));
  const deviceTotal = Math.max(
    1,
    analytics.devices.reduce((sum, device) => sum + device.visitors, 0),
  );

  return (
    <>
      <header className="admin-page-header admin-analytics-header">
        <div>
          <p className="admin-eyebrow">حركة الموقع</p>
          <h1>التحليلات والزوار</h1>
          <p>اعرف الناس وصلت للموقع منين، وإيه الصفحات اللي جذبت اهتمامهم.</p>
        </div>
        <nav className="admin-period-switcher" aria-label="الفترة الزمنية">
          {[7, 30, 90].map((days) => (
            <Link
              className={period === days ? "is-active" : ""}
              href={`/admin/analytics?period=${days}`}
              key={days}
            >
              {days} يوم
            </Link>
          ))}
        </nav>
      </header>

      {!analytics.available ? (
        <div className="admin-alert admin-alert--warning admin-analytics-setup" role="status">
          التحليلات جاهزة في الكود، لكن قاعدة البيانات محتاجة تشغيل أمر <code dir="ltr">npm run db:migrate:analytics</code> مرة واحدة.
        </div>
      ) : null}

      <section className="admin-analytics-summary" aria-label="ملخص الزيارات">
        <article className="admin-analytics-primary">
          <span>زوار آخر {period} يوم</span>
          <strong>{numberFormatter.format(analytics.totals.visitors)}</strong>
          <div>
            {visitorsComparison ? (
              <small className={`admin-change admin-change--${visitorsComparison.state}`}>
                {visitorsComparison.label}
              </small>
            ) : <small>لا توجد فترة سابقة للمقارنة</small>}
            <small>إجمالي الزوار منذ بدء القياس: {numberFormatter.format(analytics.totals.allTimeVisitors)}</small>
          </div>
        </article>

        <dl className="admin-analytics-kpis">
          <div>
            <dt>مشاهدات الصفحات</dt>
            <dd>{numberFormatter.format(analytics.totals.pageViews)}</dd>
            <small>{viewsComparison?.label ?? "لا توجد مقارنة بعد"}</small>
          </div>
          <div>
            <dt>الجلسات</dt>
            <dd>{numberFormatter.format(analytics.totals.sessions)}</dd>
            <small>{decimalFormatter.format(analytics.totals.averagePagesPerSession)} صفحة لكل جلسة</small>
          </div>
          <div>
            <dt>طلبات جديدة</dt>
            <dd>{numberFormatter.format(analytics.totals.orders)}</dd>
            <small>تحويل تقريبي {decimalFormatter.format(analytics.totals.conversionRate)}٪</small>
          </div>
        </dl>
      </section>

      <section className="admin-panel admin-analytics-trend">
        <div className="admin-panel__header">
          <div><p className="admin-eyebrow">الاتجاه اليومي</p><h2>الزيارات بمرور الوقت</h2></div>
          <div className="admin-chart-legend" aria-label="مفتاح الرسم">
            <span><i className="is-visitors" /> الزوار</span>
            <span><i className="is-views" /> المشاهدات</span>
          </div>
        </div>
        {analytics.daily.some((point) => point.pageViews > 0) ? (
          <AnalyticsChart points={analytics.daily} />
        ) : (
          <div className="admin-empty"><h3>القياس بدأ من دلوقتي.</h3><p>أول زيارة للموقع هتظهر هنا تلقائيًا.</p></div>
        )}
      </section>

      <div className="admin-analytics-grid">
        <section className="admin-panel admin-top-pages">
          <div className="admin-panel__header">
            <div><p className="admin-eyebrow">اهتمام الزوار</p><h2>أكثر الصفحات مشاهدة</h2></div>
          </div>
          {analytics.topPages.length ? (
            <div className="admin-table-scroll">
              <table>
                <thead><tr><th>الصفحة</th><th>الزوار</th><th>المشاهدات</th></tr></thead>
                <tbody>
                  {analytics.topPages.map((page) => (
                    <tr key={page.path}>
                      <td><b>{pageLabel(page.path)}</b><code dir="ltr">{page.path}</code></td>
                      <td>{numberFormatter.format(page.visitors)}</td>
                      <td>{numberFormatter.format(page.views)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-empty"><h3>لسه مفيش صفحات مرتبة.</h3><p>هتظهر هنا بعد تسجيل أول زيارات.</p></div>
          )}
        </section>

        <section className="admin-panel admin-traffic-sources">
          <div className="admin-panel__header">
            <div><p className="admin-eyebrow">الاكتساب</p><h2>مصادر الزيارات</h2></div>
          </div>
          {analytics.sources.length ? (
            <ol>
              {analytics.sources.map((source) => (
                <li key={source.source}>
                  <div><b dir="auto">{sourceLabel(source.source)}</b><span>{numberFormatter.format(source.sessions)} جلسة</span></div>
                  <span className="admin-progress"><i style={{ width: `${(source.sessions / sourceMaximum) * 100}%` }} /></span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="admin-empty"><h3>مصادر الزيارات هتظهر هنا.</h3><p>بنقيس الزيارة المباشرة وروابط الحملات.</p></div>
          )}
        </section>
      </div>

      <div className="admin-analytics-audience">
        <section className="admin-panel admin-device-panel">
          <div className="admin-panel__header">
            <div><p className="admin-eyebrow">نوع الجهاز</p><h2>الزوار بيتصفحوا منين؟</h2></div>
          </div>
          {analytics.devices.length ? (
            <div className="admin-device-list">
              {analytics.devices.map((device) => {
                const labels = { mobile: "موبايل", desktop: "كمبيوتر", tablet: "تابلت" };
                const percentage = (device.visitors / deviceTotal) * 100;
                return (
                  <div key={device.device}>
                    <span>{labels[device.device]}</span>
                    <b>{decimalFormatter.format(percentage)}٪</b>
                    <span className="admin-progress"><i style={{ width: `${percentage}%` }} /></span>
                  </div>
                );
              })}
            </div>
          ) : <div className="admin-empty"><p>بيانات الأجهزة هتظهر مع الزيارات.</p></div>}
        </section>

        <section className="admin-panel admin-behavior-panel">
          <div className="admin-panel__header">
            <div><p className="admin-eyebrow">سلوك الجمهور</p><h2>العودة والتفاعل</h2></div>
          </div>
          <dl>
            <div><dt>زوار رجعوا للموقع</dt><dd>{decimalFormatter.format(returningRate)}٪</dd></div>
            <div><dt>جلسات بصفحة واحدة</dt><dd>{decimalFormatter.format(singlePageRate)}٪</dd></div>
          </dl>
          <p>الأرقام تقريبية وتعتمد على متصفح مجهول، بدون حفظ أسماء أو عناوين IP.</p>
        </section>
      </div>
    </>
  );
}
