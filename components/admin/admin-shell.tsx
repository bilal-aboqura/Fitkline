"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  { href: "/admin/dashboard", label: "نظرة عامة" },
  { href: "/admin/content", label: "محتوى الموقع" },
  { href: "/admin/products", label: "المنتجات والأسعار" },
  { href: "/admin/shipping", label: "المحافظات والشحن" },
  { href: "/admin/orders", label: "الطلبات" },
  { href: "/admin/settings", label: "الإعدادات والدفع" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar${open ? " is-open" : ""}`}>
        <div className="admin-sidebar__brand" dir="ltr">
          <span>FITKLINE</span>
          <b>ADMIN</b>
        </div>
        <nav aria-label="أقسام لوحة التحكم">
          {navigation.map((item) => (
            <Link
              className={pathname.startsWith(item.href) ? "is-active" : ""}
              href={item.href}
              key={item.href}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <Link href="/" target="_blank">عرض الموقع ↗</Link>
          <form action="/api/admin/logout" method="post">
            <button type="submit">تسجيل الخروج</button>
          </form>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <button
            className="admin-menu"
            type="button"
            aria-expanded={open}
            aria-label="فتح قائمة الإدارة"
            onClick={() => setOpen((current) => !current)}
          >
            <span />
            <span />
          </button>
          <div>
            <span>FITKLINE CONTROL</span>
            <b>تعديلاتك تظهر على الموقع مباشرة بعد الحفظ</b>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
