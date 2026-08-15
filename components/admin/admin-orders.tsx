"use client";

import { useEffect, useMemo, useState } from "react";
import type { OrderStatus, StoredOrder } from "@/lib/order-store";

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
          <h2>حالة الطلب والدفع</h2>
          <dl>
            <div><dt>حالة التنفيذ</dt><dd>{statusLabels[order.orderStatus]}</dd></div>
            <div><dt>طريقة الدفع</dt><dd>{order.paymentMethod === "kashier" ? "دفع إلكتروني" : "الدفع عند الاستلام"}</dd></div>
            <div><dt>حالة الدفع</dt><dd>{paymentStatusLabels[order.paymentStatus]}</dd></div>
            {order.kashierPaymentId ? (
              <div><dt>رقم عملية الدفع</dt><dd dir="ltr">{order.kashierPaymentId}</dd></div>
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
}: {
  initialOrders: StoredOrder[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [message, setMessage] = useState("");
  const [savingReference, setSavingReference] = useState<string | null>(null);
  const [printOrder, setPrintOrder] = useState<StoredOrder | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialOrders.map((order) => [order.reference, order.notes ?? ""])),
  );

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesFilter = filter === "all" || order.orderStatus === filter;
      const matchesQuery =
        !normalized ||
        order.reference.toLowerCase().includes(normalized) ||
        order.customer.name.toLowerCase().includes(normalized) ||
        order.customer.phone.includes(normalized) ||
        order.customer.alternatePhone?.includes(normalized) ||
        order.notes?.toLowerCase().includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [orders, query, filter]);

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

  return (
    <section className="admin-panel admin-orders">
      <div className="admin-table-tools">
        <label>
          <span className="sr-only">ابحث في الطلبات</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث بالاسم، الهاتف، رقم الطلب، أو الملاحظة"
          />
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
  );
}
