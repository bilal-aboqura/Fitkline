import { AdminOrders } from "@/components/admin/admin-orders";
import { getOrders } from "@/lib/order-store";

export const metadata = { title: "الطلبات" };

export default async function AdminOrdersPage() {
  const orders = await getOrders();
  return (
    <>
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">التشغيل والمتابعة</p>
          <h1>الطلبات</h1>
          <p>تابع بيانات العميل والدفع، وأنشئ شحنات بوسطة مع حالة توصيل تتحدث تلقائيًا.</p>
        </div>
      </header>
      <AdminOrders initialOrders={orders} />
    </>
  );
}
