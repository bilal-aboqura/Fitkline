"use client";

import { useMemo, useState } from "react";
import type { OrderStatus, StoredOrder } from "@/lib/order-store";

const statusLabels: Record<OrderStatus, string> = {
  new: "جديد",
  confirmed: "تم التأكيد",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  completed: "مكتمل",
  cancelled: "ملغي",
};

export function AdminOrders({
  initialOrders,
}: {
  initialOrders: StoredOrder[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [message, setMessage] = useState("");

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesFilter = filter === "all" || order.orderStatus === filter;
      const matchesQuery =
        !normalized ||
        order.reference.toLowerCase().includes(normalized) ||
        order.customer.name.toLowerCase().includes(normalized) ||
        order.customer.phone.includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [orders, query, filter]);

  async function updateStatus(reference: string, orderStatus: OrderStatus) {
    setMessage("جاري تحديث الطلب…");
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference, orderStatus }),
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
    setMessage(`تم تحديث ${reference}.`);
  }

  return (
    <section className="admin-panel admin-orders">
      <div className="admin-table-tools">
        <label>
          <span className="sr-only">ابحث في الطلبات</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم، الهاتف، أو رقم الطلب"
          />
        </label>
        <label>
          <span className="sr-only">فلترة حسب الحالة</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | OrderStatus)}
          >
            <option value="all">كل الحالات</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {message ? (
        <p className="admin-live-message" role="status">
          {message}
        </p>
      ) : null}

      {visible.length ? (
        <div className="admin-orders__list">
          {visible.map((order) => (
            <details key={order.reference}>
              <summary>
                <span>
                  <b dir="ltr">{order.reference}</b>
                  <small>
                    {new Date(order.createdAt).toLocaleString("ar-EG")}
                  </small>
                </span>
                <span>
                  <b>{order.customer.name}</b>
                  <small dir="ltr">{order.customer.phone}</small>
                </span>
                <span>
                  <b>
                    {order.total === null
                      ? "الإجمالي قيد التأكيد"
                      : `${order.total.toLocaleString("ar-EG")} ج.م`}
                  </b>
                  <small>
                    {order.paymentMethod === "kashier"
                      ? "كاشير"
                      : "دفع عند الاستلام"}{" "}
                    · {order.paymentStatus}
                  </small>
                </span>
                <span
                  className={`admin-status admin-status--${order.orderStatus}`}
                >
                  {statusLabels[order.orderStatus]}
                </span>
              </summary>
              <div className="admin-order-detail">
                <section>
                  <h3>بيانات العميل</h3>
                  <dl>
                    <div>
                      <dt>الاسم</dt>
                      <dd>{order.customer.name}</dd>
                    </div>
                    <div>
                      <dt>الهاتف</dt>
                      <dd dir="ltr">{order.customer.phone}</dd>
                    </div>
                    <div>
                      <dt>البريد</dt>
                      <dd dir="ltr">{order.customer.email}</dd>
                    </div>
                    <div>
                      <dt>المحافظة</dt>
                      <dd>{order.customer.governorate}</dd>
                    </div>
                    <div>
                      <dt>المدينة / المنطقة</dt>
                      <dd>{order.customer.city}</dd>
                    </div>
                    <div>
                      <dt>العنوان</dt>
                      <dd>{order.customer.address}</dd>
                    </div>
                  </dl>
                </section>
                <section>
                  <h3>المنتجات</h3>
                  <ul>
                    {order.items.map((item) => (
                      <li key={`${item.slug}-${item.sizeId}`}>
                        <span dir="ltr">{item.name}</span>
                        <span>
                          {item.sizeLabel} × {item.quantity}
                        </span>
                        {item.discountPercent ? (
                          <small>خصم {item.discountPercent}%</small>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <dl>
                    <div>
                      <dt>المجموع الفرعي</dt>
                      <dd>
                        {order.subtotal === null
                          ? "قيد التأكيد"
                          : `${order.subtotal.toLocaleString("ar-EG")} ج.م`}
                      </dd>
                    </div>
                    <div>
                      <dt>الشحن</dt>
                      <dd>
                        {order.shippingAmount === null
                          ? "قيد التأكيد"
                          : `${order.shippingAmount.toLocaleString("ar-EG")} ج.م`}
                      </dd>
                    </div>
                    <div>
                      <dt>الإجمالي</dt>
                      <dd>
                        {order.total === null
                          ? "قيد التأكيد"
                          : `${order.total.toLocaleString("ar-EG")} ج.م`}
                      </dd>
                    </div>
                  </dl>
                </section>
                <label>
                  <span>حالة التنفيذ</span>
                  <select
                    value={order.orderStatus}
                    onChange={(e) =>
                      void updateStatus(
                        order.reference,
                        e.target.value as OrderStatus,
                      )
                    }
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
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
    </section>
  );
}
