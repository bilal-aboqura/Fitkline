"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: form.get("password") }),
    });
    const result = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(result.error ?? "تعذر تسجيل الدخول.");
      return;
    }
    router.replace("/admin/dashboard");
    router.refresh();
  }

  return (
    <form className="admin-login__form" onSubmit={handleSubmit}>
      <label>
        <span>كلمة مرور الإدارة</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={!configured || loading}
        />
      </label>
      {!configured ? (
        <p className="admin-alert admin-alert--warning">
          الإدارة غير مفعّلة بعد. أضف ADMIN_PASSWORD وADMIN_SESSION_SECRET بطول 24 حرفًا على الأقل.
        </p>
      ) : null}
      {error ? <p className="admin-alert admin-alert--error" role="alert">{error}</p> : null}
      <button type="submit" disabled={!configured || loading}>
        {loading ? "جاري تسجيل الدخول…" : "ادخل لوحة التحكم"}
      </button>
    </form>
  );
}

