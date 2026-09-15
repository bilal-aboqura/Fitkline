"use client";

import { useEffect, useMemo, useState } from "react";
import {
  bostaStatusGroups,
  getBostaDisplayStatus,
  getBostaStateMeta,
} from "@/lib/bosta-status";
import type { BostaStatusKey } from "@/lib/bosta-status";
import { mylerzStatusLabel } from "@/lib/mylerz-status";
import type { OrderStatus, StoredOrder } from "@/lib/order-store";
import type { Product } from "@/data/products";

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

type OrderItemDraft = StoredOrder["items"][number];

function cloneItems(items: StoredOrder["items"]): OrderItemDraft[] {
  return items.map((item) => ({ ...item }));
}

function orderWhatsAppLink(order: StoredOrder) {
  const phone = order.customer.phone.replace(/\D/g, "");
  const recipient = phone.startsWith("0") ? `2${phone}` : phone;
  const products = order.items
    .map((item) => `• ${item.name} ${item.sizeLabel} × ${item.quantity} — ${money(item.unitPrice === null ? null : item.unitPrice * item.quantity)}`)
    .join("\n");
  const text = [
    `🛒 *طلب جديد ${order.reference}*`,
    `👤 *العميل:* ${order.customer.name}`,
    `📞 *التليفون:* ${order.customer.phone}`,
    ...(order.customer.alternatePhone ? [`📞 *تليفون إضافي:* ${order.customer.alternatePhone}`] : []),
    `📍 *العنوان:* ${order.customer.governorate}، ${order.customer.city} — ${order.customer.address}`,
    `💳 *الدفع:* ${order.paymentMethod === "kashier" ? "دفع إلكتروني" : "الدفع عند الاستلام"}`,
    "*المنتجات:*",
    products,
    `🚚 *الشحن:* ${money(order.shippingAmount)}`,
    `💰 *الإجمالي:* ${money(order.total)}`,
  ].join("\n");
  return `https://wa.me/${recipient}?text=${encodeURIComponent(text)}`;
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

function MylerzStatus({ order, compact = false }: { order: StoredOrder; compact?: boolean }) {
  if (!order.mylerz) {
    return (
      <span className="admin-bosta-status admin-bosta-status--muted">
        غير مرسل لـMylerz
      </span>
    );
  }
  const display = mylerzStatusLabel(order.mylerz.status);
  return (
    <span className={`admin-bosta-status admin-bosta-status--${display.tone}`}>
      {display.label}
      <small dir="ltr">
        {order.mylerz.status}
        {!compact ? ` · #${order.mylerz.trackingNumber}` : ""}
      </small>
    </span>
  );
}

function ShipmentStatus({ order, compact = false }: { order: StoredOrder; compact?: boolean }) {
  if (order.bosta) return <BostaStatus order={order} compact={compact} />;
  if (order.mylerz) return <MylerzStatus order={order} compact={compact} />;
  return <BostaStatus order={order} compact={compact} />;
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
            <div><dt>حالة الشحن</dt><dd>{order.bosta ? getBostaDisplayStatus(order.bosta).label : order.mylerz ? mylerzStatusLabel(order.mylerz.status).label : "غير مرسل"}</dd></div>
            {order.bosta ? (
              <div><dt>حالة Bosta الأصلية</dt><dd dir="ltr">{order.bosta.stateValue ?? getBostaStateMeta(order.bosta.stateCode).value}</dd></div>
            ) : null}
            {order.bosta ? (
              <div><dt>رقم التتبع</dt><dd dir="ltr">{order.bosta.trackingNumber}</dd></div>
            ) : null}
            {order.mylerz ? (
              <><div><dt>شركة الشحن</dt><dd>Mylerz</dd></div><div><dt>رقم التتبع</dt><dd dir="ltr">{order.mylerz.trackingNumber}</dd></div></>
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
  const [shippingFilter, setShippingFilter] = useState<"all" | "not-sent" | "mylerz" | BostaStatusKey>("all");
  const [message, setMessage] = useState("");
  const [savingReference, setSavingReference] = useState<string | null>(null);
  const [bostaReference, setBostaReference] = useState<string | null>(null);
  const [mylerzReference, setMylerzReference] = useState<string | null>(null);
  const [importingBosta, setImportingBosta] = useState(false);
  const [syncingMylerz, setSyncingMylerz] = useState(false);
  const [printOrder, setPrintOrder] = useState<StoredOrder | null>(null);
  const [catalog, setCatalog] = useState<Product[] | null>(null);
  const [editingReference, setEditingReference] = useState<string | null>(null);
  const [itemDrafts, setItemDrafts] = useState<Record<string, OrderItemDraft[]>>({});
  const [shippingDrafts, setShippingDrafts] = useState<Record<string, string>>({});
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
          ? !order.bosta && !order.mylerz
          : shippingFilter === "mylerz"
            ? Boolean(order.mylerz)
          : displayStatus?.key === shippingFilter);
      const matchesQuery =
        !normalized ||
        order.reference.toLowerCase().includes(normalized) ||
        order.customer.name.toLowerCase().includes(normalized) ||
        order.customer.phone.includes(normalized) ||
        order.customer.alternatePhone?.includes(normalized) ||
        order.bosta?.trackingNumber.includes(normalized) ||
        order.mylerz?.trackingNumber.includes(normalized) ||
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
    changes: {
      orderStatus?: OrderStatus;
      notes?: string;
      items?: StoredOrder["items"];
      shippingAmount?: number;
    },
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
      if (changes.items || changes.shippingAmount !== undefined) {
        setEditingReference(null);
      }
    } catch {
      setMessage("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setSavingReference(null);
    }
  }

  async function openOrderEditor(order: StoredOrder) {
    setItemDrafts((current) => ({ ...current, [order.reference]: cloneItems(order.items) }));
    setShippingDrafts((current) => ({ ...current, [order.reference]: String(order.shippingAmount ?? "") }));
    setEditingReference(order.reference);
    if (catalog) return;
    setMessage("جاري تحميل كتالوج المنتجات…");
    try {
      const response = await fetch("/api/admin/products");
      const result = (await response.json()) as { data?: Product[]; error?: string };
      if (!response.ok || !result.data) {
        setMessage(result.error ?? "تعذر تحميل كتالوج المنتجات.");
        return;
      }
      setCatalog(result.data);
      setMessage("");
    } catch {
      setMessage("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    }
  }

  function updateItemDraft(
    reference: string,
    index: number,
    changes: Partial<OrderItemDraft>,
  ) {
    setItemDrafts((current) => ({
      ...current,
      [reference]: (current[reference] ?? []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...changes } : item,
      ),
    }));
  }

  function removeItemDraft(reference: string, index: number) {
    setItemDrafts((current) => ({
      ...current,
      [reference]: (current[reference] ?? []).filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function addCatalogItem(reference: string, value: string) {
    const [slug, sizeId] = value.split(":") as [string, "4kg" | "20kg"];
    const product = catalog?.find((candidate) => candidate.slug === slug);
    const size = product?.sizes.find((candidate) => candidate.id === sizeId);
    if (!product || !size) return;
    setItemDrafts((current) => {
      const items = current[reference] ?? [];
      const existingIndex = items.findIndex((item) => item.slug === slug && item.sizeId === sizeId);
      if (existingIndex >= 0) {
        return {
          ...current,
          [reference]: items.map((item, index) => index === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item),
        };
      }
      return {
        ...current,
        [reference]: [...items, {
          slug: product.slug,
          name: product.name,
          sizeId,
          sizeLabel: size.label,
          quantity: 1,
          unitPrice: size.price,
          ...(size.price !== null ? { listUnitPrice: size.price } : {}),
        }],
      };
    });
  }

  function saveOrderEditor(order: StoredOrder) {
    const items = itemDrafts[order.reference] ?? [];
    const shippingText = shippingDrafts[order.reference] ?? "";
    const shippingAmount = Number(shippingText);
    if (!items.length) {
      setMessage("أضف منتجًا واحدًا على الأقل قبل الحفظ.");
      return;
    }
    if (!shippingText.trim() || !Number.isFinite(shippingAmount) || shippingAmount < 0) {
      setMessage("أدخل سعر شحن يدوي صحيح.");
      return;
    }
    void patchOrder(order.reference, { items, shippingAmount });
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

  async function runMylerzAction(reference: string, action: "create" | "sync") {
    setMylerzReference(reference);
    setMessage(action === "create" ? "جاري إنشاء الشحنة في Mylerz…" : "جاري جلب أحدث حالة من Mylerz…");
    try {
      const response = await fetch("/api/admin/orders/mylerz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, action }),
      });
      const result = (await response.json()) as { data?: StoredOrder; error?: string };
      if (!response.ok || !result.data) {
        setMessage(result.error ?? "تعذر تنفيذ طلب Mylerz.");
        return;
      }
      setOrders((current) => current.map((order) => order.reference === reference ? result.data! : order));
      setMessage(action === "create" ? `تم إنشاء شحنة Mylerz للطلب ${reference}.` : `تم تحديث حالة شحنة ${reference}.`);
    } catch {
      setMessage("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setMylerzReference(null);
    }
  }

  async function syncAllMylerzShipments() {
    setSyncingMylerz(true);
    setMessage("جاري مزامنة كل شحنات Mylerz…");
    try {
      const response = await fetch("/api/admin/orders/mylerz/sync-all", { method: "POST" });
      const result = (await response.json()) as {
        data?: { found: number; refreshed: number; failedReferences: string[]; orders: StoredOrder[] };
        error?: string;
      };
      if (!response.ok || !result.data) {
        setMessage(result.error ?? "تعذر مزامنة شحنات Mylerz.");
        return;
      }
      const changed = new Map(result.data.orders.map((order) => [order.reference, order]));
      setOrders((current) => current.map((order) => changed.get(order.reference) ?? order));
      setMessage(
        result.data.found === 0
          ? "لا توجد شحنات Mylerz لمزامنتها."
          : `تم تحديث ${result.data.refreshed} شحنة Mylerz من أصل ${result.data.found}` +
              (result.data.failedReferences.length ? ` — تعذر تحديث ${result.data.failedReferences.length} شحنة.` : "."),
      );
    } catch {
      setMessage("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setSyncingMylerz(false);
    }
  }

  return (
    <>
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
        <button
          className="admin-secondary-action admin-mylerz-sync-all-action"
          type="button"
          disabled={syncingMylerz}
          onClick={() => void syncAllMylerzShipments()}
        >
          {syncingMylerz ? "جاري مزامنة Mylerz…" : "مزامنة كل شحنات Mylerz"}
        </button>
        <label>
          <span className="sr-only">فلترة حسب حالة بوسطة</span>
          <select
            value={shippingFilter}
            onChange={(event) => setShippingFilter(event.target.value as "all" | "not-sent" | "mylerz" | BostaStatusKey)}
          >
            <option value="all">الحالة الحالية — كل الحالات</option>
            <option value="not-sent">غير مرسل لشركة شحن</option>
            <option value="mylerz">شحنات Mylerz</option>
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
                <ShipmentStatus order={order} compact />
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
                  <div className="admin-order-products__heading">
                    <h3>المنتجات والحساب</h3>
                    <button
                      className="admin-secondary-action admin-order-edit-trigger"
                      type="button"
                      onClick={() => void openOrderEditor(order)}
                    >
                      تعديل الطلب
                    </button>
                  </div>
                  {editingReference === order.reference ? (
                    <div className="admin-order-editor">
                      <p>عدّل الكميات والأسعار، أضف من الكتالوج أو احذف منتجات. يُعاد حساب الإجمالي عند الحفظ.</p>
                      <div className="admin-order-editor__items">
                        {(itemDrafts[order.reference] ?? []).map((item, index) => (
                          <div className="admin-order-editor__item" key={`${item.slug}-${item.sizeId}-${index}`}>
                            <strong dir="ltr">{item.name} <small>{item.sizeLabel}</small></strong>
                            <label><span>الكمية</span><input type="number" min="1" step="1" value={item.quantity} onChange={(event) => updateItemDraft(order.reference, index, { quantity: Math.max(1, Math.floor(Number(event.target.value) || 1)) })} /></label>
                            <label><span>سعر الوحدة</span><input type="number" min="0" step="0.01" value={item.unitPrice ?? ""} placeholder="غير محدد" onChange={(event) => updateItemDraft(order.reference, index, { unitPrice: event.target.value === "" ? null : Number(event.target.value), listUnitPrice: event.target.value === "" ? undefined : Number(event.target.value), discountPercent: undefined })} /></label>
                            <button className="admin-text-action admin-text-action--danger" type="button" onClick={() => removeItemDraft(order.reference, index)}>حذف</button>
                          </div>
                        ))}
                      </div>
                      <label className="admin-order-editor__add">
                        <span>إضافة منتج</span>
                        <select defaultValue="" disabled={!catalog} onChange={(event) => { addCatalogItem(order.reference, event.target.value); event.currentTarget.value = ""; }}>
                          <option value="" disabled>{catalog ? "اختر منتجًا وحجمًا" : "جاري تحميل الكتالوج…"}</option>
                          {catalog?.flatMap((product) => product.active ? product.sizes.filter((size) => size.active).map((size) => (
                            <option key={`${product.slug}:${size.id}`} value={`${product.slug}:${size.id}`}>
                              {product.name} — {size.label}{size.price === null ? " (السعر غير محدد)" : ` — ${money(size.price)}`}
                            </option>
                          )) : [])}
                        </select>
                      </label>
                      <label className="admin-order-editor__shipping"><span>سعر الشحن اليدوي (ج.م)</span><input type="number" min="0" step="0.01" inputMode="decimal" value={shippingDrafts[order.reference] ?? ""} onChange={(event) => setShippingDrafts((current) => ({ ...current, [order.reference]: event.target.value }))} /></label>
                      <div className="admin-order-editor__actions">
                        <button className="admin-primary-action" type="button" disabled={savingReference === order.reference} onClick={() => saveOrderEditor(order)}>{savingReference === order.reference ? "جاري الحفظ…" : "حفظ الطلب وإعادة الحساب"}</button>
                        <button className="admin-secondary-action" type="button" disabled={savingReference === order.reference} onClick={() => setEditingReference(null)}>إلغاء</button>
                      </div>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
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
                      <p>{order.mylerz ? "الطلب مربوط بـMylerz بالفعل. استخدم شركة شحن واحدة لكل طلب." : "أنشئ الشحنة ليظهر رقم التتبع وتصل تحديثات بوسطة تلقائيًا."}</p>
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
                        disabled={bostaReference === order.reference || Boolean(order.mylerz)}
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
                  <section className="admin-order-bosta" aria-label="شحن Mylerz">
                    <div>
                      <span className="admin-order-bosta__brand">MYLERZ SHIPPING</span>
                      <MylerzStatus order={order} />
                    </div>
                    {order.mylerz ? (
                      <>
                        <dl>
                          <div><dt>الحالة الحالية</dt><dd>{mylerzStatusLabel(order.mylerz.status).label}</dd></div>
                          <div><dt>حالة Mylerz</dt><dd dir="ltr">{order.mylerz.status}</dd></div>
                          <div><dt>آخر تحديث</dt><dd>{new Date(order.mylerz.statusUpdatedAt).toLocaleString("ar-EG")}</dd></div>
                          {order.mylerz.pickupOrderCode ? <div><dt>رقم طلب الاستلام</dt><dd dir="ltr">{order.mylerz.pickupOrderCode}</dd></div> : null}
                        </dl>
                        {order.mylerz.timeline?.length ? (
                          <ol className="admin-bosta-timeline" aria-label="مراحل الشحنة في Mylerz">
                            {order.mylerz.timeline.map((step, index) => (
                              <li className="is-done" key={`${step.status}-${index}`}><span aria-hidden="true" /><div><b dir="ltr">{step.status}</b>{step.changedAt ? <time dir="ltr">{step.changedAt}</time> : null}</div></li>
                            ))}
                          </ol>
                        ) : null}
                      </>
                    ) : (
                      <p>{order.bosta ? "الطلب مربوط ببوسطة بالفعل. استخدم شركة شحن واحدة لكل طلب." : "أنشئ شحنة Mylerz ليظهر رقم التتبع والبوليصة وحالة الشحنة."}</p>
                    )}
                    <div className="admin-order-bosta__actions">
                      <button
                        className="admin-primary-action"
                        type="button"
                        disabled={mylerzReference === order.reference || Boolean(order.bosta)}
                        onClick={() => void runMylerzAction(order.reference, order.mylerz ? "sync" : "create")}
                      >
                        {mylerzReference === order.reference ? "جاري الاتصال بـMylerz…" : order.mylerz ? "تحديث من Mylerz" : "إنشاء شحنة Mylerz"}
                      </button>
                      {order.mylerz ? <a className="admin-secondary-action" href={`/api/admin/orders/mylerz/awb?reference=${encodeURIComponent(order.reference)}`}>طباعة بوليصة الشحن</a> : null}
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
                  <a
                    className="admin-secondary-action admin-whatsapp-action"
                    href={orderWhatsAppLink(order)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    مراسلة العميل على واتساب
                  </a>
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
