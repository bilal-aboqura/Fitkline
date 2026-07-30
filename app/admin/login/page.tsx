import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { adminAuthConfigured, isAdminAuthenticated } from "@/lib/admin-auth";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect("/admin/dashboard");
  return (
    <main className="admin-login">
      <section className="admin-login__panel">
        <div className="admin-login__brand" dir="ltr">
          <span>FITKLINE</span>
          <b>CONTROL</b>
        </div>
        <div>
          <p className="admin-eyebrow">لوحة الإدارة</p>
          <h1>تحكم في الموقع من مكان واحد.</h1>
          <p>المحتوى، المنتجات، الأسعار، الصور، الطلبات، وحالة الدفع.</p>
        </div>
        <AdminLoginForm configured={adminAuthConfigured()} />
      </section>
    </main>
  );
}

