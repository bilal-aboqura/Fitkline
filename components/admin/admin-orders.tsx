"use client";

import { useEffect, useMemo, useState } from "react";
import {
  bostaStatusGroups,
  getBostaDisplayStatus,
  getBostaStateMeta,
} from "@/lib/bosta-status";
import type { BostaStatusKey } from "@/lib/bosta-status";
import type { OrderStatus, StoredOrder } from "@/lib/order-store";
import type { StoredBostaPickup } from "@/lib/pickup-store";

const statusLabels: Record<OrderStatus, string> = {
  new: "جديد",
  confirmed: "تم التأكيد",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  completed: "مكتمل",
  cancelled: "ملغي",
};

const paymentStatusLabels: Record<StoredOrder["paymentStatus"], string> = {
  pending: "في انتظار الدفع",
  paid: "مدفوع",
  failed: "فشل الدفع",
  "not-required": "الدفع عند الاستلام",
};

function money(value: number | null) {
  if (value === null) return "قيد التأكيد";
  return `${value.toLocaleString("ar-EG", {
    minimumFractionDigits: value % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  })} ج.م`;
}

function itemListUnitPrice(item: StoredOrder["items"][number]) {
  return item.listUnitPrice ?? item.unitPrice;
}

function getOrderListSubtotal(order: StoredOrder) {
  return order.items.reduce<number | null>((total, item) => {
    const unitPrice = itemListUnitPrice(item);
    return total === null || unitPrice === null
      ? null
      : total + unitPrice * item.quantity;
  }, 0);
}

function getOrderDiscount(order: StoredOrder) {
  if (order.subtotal === null) return null;
  const listSubtotal = getOrderListSubtotal(order);
  return listSubtotal === null
    ? null
    : Math.max(0, Math.round((listSubtotal - order.subtotal) * 100) / 100);
}

function BostaStatus({ order, compact = false }: { order: StoredOrder; compact?: boolean }) {
  if (!order.bosta) {
    return (
      <span className="admin-bosta-status admin-bosta-status--muted">
        غير مرسل لبوسطة
      </span>
    );
  }
  const state = getBostaStateMeta(order.bosta.stateCode);
  const display = getBostaDisplayStatus(order.bosta);
  return (
    <span className={`admin-bosta-status admin-bosta-status--${state.tone}`}>
      {display.label}
      <small dir="ltr">
        {order.bosta.stateValue ?? state.value}
        {!compact ? ` · #${order.bosta.trackingNumber}` : ""}
      </small>
    </span>
  );
}

function PickupAutomationPanel({
  orders,
  pickups,
}: {
  orders: StoredOrder[];
  pickups: StoredBostaPickup[];
}) {
  const confirmed = orders.filter(
    (order) => order.orderStatus === "confirmed" && !order.bosta?.pickup?.id,
  ).length;
  return (
    <section className="admin-panel admin-pickup-automation" aria-label="جدولة استلام بوسطة التلقائية">
      <div className="admin-panel__header">
        <h2>جدولة الاستلام التلقائية</h2>
        <span className={`admin-connection${confirmed >= 3 ? " is-ready" : ""}`}>
          {confirmed >= 3 ? "جاهز للجدولة" : `${confirmed}/3 طلبات مؤكدة`}
        </span>
      </div>
      <div className="admin-pickup-automation__summary">
        <div><span>التشغيل اليومي</span><strong dir="ltr">12:00 AM</strong></div>
        <div><span>الحد الأدنى</span><strong>3 طلبات</strong></div>
      </div>
      {pickups.length ? (
        <div className="admin-pickup-history">
          {pickups.slice(0, 4).map((pickup) => (
            <div key={pickup.automationKey}>
              <span><b>{pickup.scheduledDate ?? pickup.createdAt.slice(0, 10)}</b></span>
              <span><b>{pickup.parcelCount} شحنات</b><small>{pickup.scheduledTimeSlot ?? "الموعد تحدده بوسطة"}</small></span>
              <span className={`admin-pickup-run admin-pickup-run--${pickup.status}`}>
                {pickup.status === "completed" ? "تمت الجدولة" : pickup.status === "skipped" ? "أقل من 3" : pickup.status === "running" ? "جاري التنفيذ" : "تعذر التنفيذ"}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function OrderPrintSheet({ order }: { order: StoredOrder }) {
  const listSubtotal = getOrderListSubtotal(order);
  const discount = getOrderDiscount(order);
  const discountPercent = order.items.find(
    (item) => item.discountPercent,
  )?.discountPercent;

  return (
    <article className="admin-order-print-sheet" aria-label={`طباعة الطلب ${order.reference}`}>
      <header className="admin-order-print-sheet__header">
        <div>
          <p>FITKLINE / ORDER</p>
          <h1>تفاصيل الطلب</h1>
        </div>
        <div>
          <b dir="ltr">{order.reference}</b>
          <time dateTime={order.createdAt}>
            {new Date(order.createdAt).toLocaleString("ar-EG")}
          </time>
        </div>
      </header>

      <section className="admin-order-print-sheet__meta">
        <div>
          <h2>بيانات العميل والتوصيل</h2>
          <dl>
            <div><dt>الاسم</dt><dd>{order.customer.name}</dd></div>
            <div><dt>الهاتف الأساسي</dt><dd dir="ltr">{order.customer.phone}</dd></div>
            {order.customer.alternatePhone ? (
              <div><dt>الهاتف البديل</dt><dd dir="ltr">{order.customer.alternatePhone}</dd></div>
            ) : null}
            <div><dt>البريد الإلكتروني</dt><dd dir="ltr">{order.customer.email}</dd></div>
            <div><dt>المحافظة</dt><dd>{order.customer.governorate}</dd></div>
            <div><dt>المدينة / المنطقة</dt><dd>{order.customer.city}</dd></div>
            <div><dt>العنوان</dt><dd>{order.customer.address}</dd></div>
          </dl>
        </div>
        <div>
          <h2>حالة الطلب والدفع والشحن</h2>
          <dl>
            <div><dt>حالة التنفيذ</dt><dd>{statusLabels[order.orderStatus]}</dd></div>
            <div><dt>طريقة الدفع</dt><dd>{order.paymentMethod === "kashier" ? "دفع إلكتروني" : "الدفع عند الاستلام"}</dd></div>
            <div><dt>حالة الدفع</dt><dd>{paymentStatusLabels[order.paymentStatus]}</dd></div>
            {order.kashierPaymentId ? (
              <div><dt>رقم عملية الدفع</dt><dd dir="ltr">{order.kashierPaymentId}</dd></div>
            ) : null}
            <div><dt>حالة بوسطة</dt><dd>{order.bosta ? getBostaDisplayStatus(order.bosta).label : "غير مرسل لبوسطة"}</dd></div>
            {order.bosta ? (
              <div><dt>حالة Bosta الأصلية</dt><dd dir="ltr">{order.bosta.stateValue ?? getBostaStateMeta(order.bosta.stateCode).value}</dd></div>
            ) : null}
            {order.bosta ? (
              <div><dt>رقم التتبع</dt><dd dir="ltr">{order.bosta.trackingNumber}</dd></div>
            ) : null}
            <div><dt>آخر تحديث</dt><dd>{new Date(order.updatedAt).toLocaleString("ar-EG")}</dd></div>
          </dl>
        </div>
      </section>

      <section className="admin-order-print-sheet__items">
        <h2>المنتجات</h2>
        <table>
          <thead>
            <tr>
              <th>المنتج</th>
              <th>الحجم</th>
              <th>الكمية</th>
              <th>سعر الوحدة قبل الخصم</th>
              <th>الخصم</th>
              <th>سعر الوحدة بعد الخصم</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={`${item.slug}-${item.sizeId}`}>
                <td dir="ltr">{item.name}</td>
                <td dir="ltr">{item.sizeLabel}</td>
                <td>{item.quantity.toLocaleString("ar-EG")}</td>
                <td>{money(itemListUnitPrice(item))}</td>
                <td>{item.discountPercent ? `${item.discountPercent}%` : "—"}</td>
                <td>{money(item.unitPrice)}</td>
                <td>{money(item.unitPrice === null ? null : item.unitPrice * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="admin-order-print-sheet__footer">
        <div className="admin-order-print-sheet__notes">
          <h2>ملاحظات الطلب</h2>
          <p>{order.notes || "لا توجد ملاحظات."}</p>
        </div>
        <dl className="admin-order-print-sheet__totals">
          <div><dt>المنتجات قبل الخصم</dt><dd>{money(listSubtotal)}</dd></div>
          {discount !== null && discount > 0 ? (
            <div><dt>قيمة الخصم{discountPercent ? ` (${discountPercent}%)` : ""}</dt><dd>− {money(discount)}</dd></div>
          ) : null}
          <div><dt>المنتجات بعد الخصم</dt><dd>{money(order.subtotal)}</dd></div>
          <div><dt>الشحن</dt><dd>{money(order.shippingAmount)}</dd></div>
          <div><dt>الإجمالي النهائي</dt><dd>{money(order.total)}</dd></div>
        </dl>
      </section>
    </article>
  );
}

export function AdminOrders({
  initialOrders,
  initialPickups,
}: {
  initialOrders: StoredOrder[];
  initialPickups: StoredBostaPickup[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [shippingFilter, setShippingFilter] = useState<"all" | "not-sent" | BostaStatusKey>("all");
  const [message, setMessage] = useState("");
  const [savingReference, setSavingReference] = useState<string | null>(null);
  const [bostaReference, setBostaReference] = useState<string | null>(null);
  const [importingBosta, setImportingBosta] = useState(false);
  const [printOrder, setPrintOrder] = useState<StoredOrder | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialOrders.map((order) => [order.reference, order.notes ?? ""])),
  );

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesFilter = filter === "all" || order.orderStatus === filter;
      const displayStatus = order.bosta
        ? getBostaDisplayStatus(order.bosta)
        : null;
      const matchesShipping =
        shippingFilter === "all" ||
        (shippingFilter === "not-sent"
          ? !order.bosta
          : displayStatus?.key === shippingFilter);
      const matchesQuery =
        !normalized ||
        order.reference.toLowerCase().includes(normalized) ||
        order.customer.name.toLowerCase().includes(normalized) ||
        order.customer.phone.includes(normalized) ||
        order.customer.alternatePhone?.includes(normalized) ||
        order.bosta?.trackingNumber.includes(normalized) ||
        (order.bosta
          ? [
              displayStatus?.label,
              displayStatus?.groupLabel,
              order.bosta.stateValue,
              order.bosta.dashboardState,
            ].some((value) => value?.toLowerCase().includes(normalized))
          : false) ||
        order.notes?.toLowerCase().includes(normalized);
      return matchesFilter && matchesShipping && matchesQuery;
    });
  }, [orders, query, filter, shippingFilter]);

  useEffect(() => {
    if (!printOrder) return;
    const finishPrinting = () => setPrintOrder(null);
    window.addEventListener("afterprint", finishPrinting, { once: true });
    const frame = window.requestAnimationFrame(() => {
      window.print();
      finishPrinting();
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("afterprint", finishPrinting);
    };
  }, [printOrder]);

  async function patchOrder(
    reference: string,
    changes: { orderStatus?: OrderStatus; notes?: string },
  ) {
    setSavingReference(reference);
    setMessage("جاري حفظ التغييرات…");
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, ...changes }),
      });
      const result = (await response.json()) as {
        data?: StoredOrder;
        error?: string;
      };
      if (!response.ok || !result.data) {
        setMessage(result.error ?? "تعذر تحديث الطلب.");
        return;
      }
      setOrders((current) =>
        current.map((order) =>
          order.reference === reference ? result.data! : order,
        ),
      );
      setNoteDrafts((current) => ({
        ...current,
        [reference]: result.data?.notes ?? "",
      }));
      setMessage(`تم حفظ التغييرات في ${reference}.`);
    } catch {
      setMessage("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setSavingReference(null);
    }
  }

  async function runBostaAction(
    reference: string,
    action: "create" | "sync",
  ) {
    setBostaReference(reference);
    setMessage(
      action === "create"
        ? "جاري إنشاء الشحنة في بوسطة…"
        : "جاري جلب أحدث حالة من بوسطة…",
    );
    try {
      const response = await fetch("/api/admin/orders/bosta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, action }),
      });
      const result = (await response.json()) as {
        data?: StoredOrder;
        error?: string;
      };
      if (!response.ok || !result.data) {
        setMessage(result.error ?? "تعذر تنفيذ طلب بوسطة.");
        return;
      }
      setOrders((current) =>
        current.map((order) =>
          order.reference === reference ? result.data! : order,
        ),
      );
      setMessage(
        action === "create"
          ? `تم إنشاء شحنة بوسطة للطلب ${reference}.`
          : `تم تحديث حالة شحنة ${reference}.`,
      );
    } catch {
      setMessage("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setBostaReference(null);
    }
  }

  async function importBostaOrders() {
    setImportingBosta(true);
    setMessage("جاري سحب أوردرات بوسطة ومطابقتها بأمان…");
    try {
      const response = await fetch("/api/admin/orders/bosta/import", {
        method: "POST",
      });
      const result = (await response.json()) as {
        data?: {
          foundInBosta: number;
          linked: number;
          refreshed: number;
          unmatchedTrackingNumbers: string[];
          ambiguousTrackingNumbers: string[];
          conflicts: string[];
          orders: StoredOrder[];
        };
        error?: string;
      };
      if (!response.ok || !result.data) {
        setMessage(result.error ?? "تعذر سحب أوردرات بوسطة.");
        return;
      }
      const changed = new Map(
        result.data.orders.map((order) => [order.reference, order]),
      );
      setOrders((current) =>
        current.map((order) => changed.get(order.reference) ?? order),
      );
      const needsReview =
        result.data.unmatchedTrackingNumbers.length +
        result.data.ambiguousTrackingNumbers.length +
        result.data.conflicts.length;
      setMessage(
        `تم ربط ${result.data.linked} أوردر وتحديث ${result.data.refreshed} شحنة من أصل ${result.data.foundInBosta}` +
          (needsReview
            ? ` — ${needsReview} شحنة لم تُربط لحمايتها من المطابقة الخطأ.`
            : "."),
      );
    } catch {
      setMessage("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setImportingBosta(false);
    }
  }

  return (
    <>
      <PickupAutomationPanel orders={orders} pickups={initialPickups} />
      <section className="admin-panel admin-orders">
      <div className="admin-table-tools">
        <label>
          <span className="sr-only">ابحث في الطلبات</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث بالاسم، الهاتف، رقم الطلب، التتبع، أو الملاحظة"
          />
        </label>
        <button
          className="admin-secondary-action admin-bosta-import-action"
          type="button"
          disabled={importingBosta}
          onClick={() => void importBostaOrders()}
        >
          {importingBosta ? "جاري السحب…" : "مزامنة كل أوردرات بوسطة"}
        </button>
        <label>
          <span className="sr-only">فلترة حسب حالة بوسطة</span>
          <select
            value={shippingFilter}
            onChange={(event) => setShippingFilter(event.target.value as "all" | "not-sent" | BostaStatusKey)}
          >
            <option value="all">الحالة الحالية — كل الحالات</option>
            <option value="not-sent">غير مرسل لبوسطة</option>
            {bostaStatusGroups.map((group) => (
              <optgroup key={group.id} label={group.label}>
                {group.options.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">فلترة حسب الحالة</span>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as "all" | OrderStatus)}
          >
            <option value="all">كل الحالات</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>
      {message ? <p className="admin-live-message" role="status">{message}</p> : null}

      {visible.length ? (
        <div className="admin-orders__list">
          {visible.map((order) => (
            <details key={order.reference}>
              <summary>
                <span>
                  <b dir="ltr">{order.reference}</b>
                  <small>{new Date(order.createdAt).toLocaleString("ar-EG")}</small>
                </span>
                <span>
                  <b>{order.customer.name}</b>
                  <small dir="ltr">{order.customer.phone}</small>
                </span>
                <span>
                  <b>{order.total === null ? "الإجمالي قيد التأكيد" : money(order.total)}</b>
                  <small>
                    {order.paymentMethod === "kashier" ? "دفع إلكتروني" : "دفع عند الاستلام"} · {paymentStatusLabels[order.paymentStatus]}
                  </small>
                </span>
                <span className={`admin-status admin-status--${order.orderStatus}`}>
                  {statusLabels[order.orderStatus]}
                </span>
                <BostaStatus order={order} compact />
              </summary>
              <div className="admin-order-detail">
                <section>
                  <h3>بيانات العميل</h3>
                  <dl>
                    <div><dt>الاسم</dt><dd>{order.customer.name}</dd></div>
                    <div><dt>الهاتف الأساسي</dt><dd dir="ltr">{order.customer.phone}</dd></div>
                    {order.customer.alternatePhone ? (
                      <div><dt>الهاتف البديل</dt><dd dir="ltr">{order.customer.alternatePhone}</dd></div>
                    ) : null}
                    <div><dt>البريد</dt><dd dir="ltr">{order.customer.email}</dd></div>
                    <div><dt>المحافظة</dt><dd>{order.customer.governorate}</dd></div>
                    <div><dt>المدينة / المنطقة</dt><dd>{order.customer.city}</dd></div>
                    <div><dt>العنوان</dt><dd>{order.customer.address}</dd></div>
                  </dl>
                </section>
                <section>
                  <h3>المنتجات والحساب</h3>
                  <ul>
                    {order.items.map((item) => (
                      <li key={`${item.slug}-${item.sizeId}`}>
                        <span dir="ltr">{item.name}</span>
                        <span>{item.sizeLabel} × {item.quantity}</span>
                        <span>{money(item.unitPrice === null ? null : item.unitPrice * item.quantity)}</span>
                        {item.discountPercent ? <small>خصم {item.discountPercent}%</small> : null}
                      </li>
                    ))}
                  </ul>
                  <dl className="admin-order-detail__totals">
                    <div><dt>قبل الخصم</dt><dd>{money(getOrderListSubtotal(order))}</dd></div>
                    {getOrderDiscount(order) ? (
                      <div><dt>الخصم</dt><dd>− {money(getOrderDiscount(order))}</dd></div>
                    ) : null}
                    <div><dt>بعد الخصم</dt><dd>{money(order.subtotal)}</dd></div>
                    <div><dt>الشحن</dt><dd>{money(order.shippingAmount)}</dd></div>
                    <div><dt>الإجمالي</dt><dd>{money(order.total)}</dd></div>
                  </dl>
                </section>
                <div className="admin-order-actions">
                  <section className="admin-order-bosta" aria-label="شحن بوسطة">
                    <div>
                      <span className="admin-order-bosta__brand">BOSTA SHIPPING</span>
                      <BostaStatus order={order} />
                    </div>
                    {order.bosta ? (
                      <dl>
                        <div><dt>الحالة الحالية</dt><dd>{getBostaDisplayStatus(order.bosta).label}</dd></div>
                        <div><dt>مجموعة الحالة</dt><dd>{getBostaDisplayStatus(order.bosta).groupLabel}</dd></div>
                        <div><dt>آخر تحديث</dt><dd>{new Date(order.bosta.stateUpdatedAt).toLocaleString("ar-EG")}</dd></div>
                        <div><dt>محاولات التسليم</dt><dd>{order.bosta.numberOfAttempts ?? 0}</dd></div>
                        <div><dt>حالة Bosta</dt><dd dir="ltr">{order.bosta.stateValue ?? getBostaStateMeta(order.bosta.stateCode).value}</dd></div>
                        <div><dt>تصنيف Dashboard</dt><dd dir="ltr">{order.bosta.dashboardState ?? getBostaStateMeta(order.bosta.stateCode).dashboard}</dd></div>
                        {order.bosta.deliveryPromiseDate ? (
                          <div><dt>موعد التسليم المتوقع</dt><dd dir="ltr">{order.bosta.deliveryPromiseDate}</dd></div>
                        ) : null}
                      </dl>
                    ) : (
                      <p>أنشئ الشحنة ليظهر رقم التتبع وتصل تحديثات بوسطة تلقائيًا.</p>
                    )}
                    {order.bosta?.exceptionReason ? (
                      <p className="admin-order-bosta__exception">
                        <b>سبب تعذر التسليم:</b> {order.bosta.exceptionReason}
                      </p>
                    ) : null}
                    {order.bosta?.pickup ? (
                      <div className="admin-order-bosta__pickup">
                        <b>تمت جدولة الاستلام</b>
                        <span>{order.bosta.pickup.scheduledDate}</span>
                        <small>{order.bosta.pickup.scheduledTimeSlot ?? "الموعد تحدده بوسطة"}</small>
                      </div>
                    ) : null}
                    {order.bosta?.timeline?.length ? (
                      <ol className="admin-bosta-timeline" aria-label="مراحل الشحنة في بوسطة">
                        {order.bosta.timeline.map((step, index) => (
                          <li className={step.done ? "is-done" : ""} key={`${step.value}-${index}`}>
                            <span aria-hidden="true" />
                            <div>
                              <b dir="ltr">{step.value}</b>
                              {step.nextAction ? <small dir="ltr">{step.nextAction}</small> : null}
                              {step.date ? <time dir="ltr">{step.date}</time> : null}
                            </div>
                          </li>
                        ))}
                      </ol>
                    ) : null}
                    <div className="admin-order-bosta__actions">
                      <button
                        className="admin-primary-action"
                        type="button"
                        disabled={bostaReference === order.reference}
                        onClick={() => void runBostaAction(
                          order.reference,
                          order.bosta ? "sync" : "create",
                        )}
                      >
                        {bostaReference === order.reference
                          ? "جاري الاتصال ببوسطة…"
                          : order.bosta
                            ? "تحديث من بوسطة"
                            : "إنشاء شحنة بوسطة"}
                      </button>
                      {order.bosta ? (
                        <a
                          className="admin-secondary-action"
                          href={`/api/admin/orders/bosta/awb?reference=${encodeURIComponent(order.reference)}`}
                        >
                          طباعة بوليصة الشحن
                        </a>
                      ) : null}
                    </div>
                  </section>
                  <label>
                    <span>حالة التنفيذ</span>
                    <select
                      value={order.orderStatus}
                      disabled={savingReference === order.reference}
                      onChange={(event) => void patchOrder(order.reference, {
                        orderStatus: event.target.value as OrderStatus,
                      })}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>ملاحظة على الطلب</span>
                    <textarea
                      rows={5}
                      maxLength={2000}
                      value={noteDrafts[order.reference] ?? ""}
                      placeholder="اكتب تعليمات التجهيز أو التوصيل أو أي متابعة داخلية…"
                      onChange={(event) => setNoteDrafts((current) => ({
                        ...current,
                        [order.reference]: event.target.value,
                      }))}
                    />
                  </label>
                  <button
                    className="admin-primary-action"
                    type="button"
                    disabled={savingReference === order.reference}
                    onClick={() => void patchOrder(order.reference, {
                      notes: noteDrafts[order.reference] ?? "",
                    })}
                  >
                    {savingReference === order.reference ? "جاري الحفظ…" : "حفظ الملاحظة"}
                  </button>
                  <button
                    className="admin-secondary-action"
                    type="button"
                    onClick={() => setPrintOrder(order)}
                  >
                    طباعة الطلب
                  </button>
                </div>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="admin-empty">
          <h2>لا توجد طلبات مطابقة.</h2>
          <p>غيّر البحث أو الفلتر لعرض نتائج أخرى.</p>
        </div>
      )}
      {printOrder ? <OrderPrintSheet order={printOrder} /> : null}
      </section>
    </>
  );
}
