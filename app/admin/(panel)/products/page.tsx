import { AdminProductManager } from "@/components/admin/admin-product-manager";
import { getCmsContent } from "@/lib/cms-store";

export const metadata = { title: "المنتجات والأسعار" };

export default async function AdminProductsPage() {
  const content = await getCmsContent();
  return (
    <>
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">الكتالوج</p>
          <h1>المنتجات والأسعار</h1>
          <p>غيّر صور 4 و20 كجم، النصوص، الأسعار، المخزون، وحالة العرض.</p>
        </div>
      </header>
      <AdminProductManager initialProducts={content.products} />
    </>
  );
}

