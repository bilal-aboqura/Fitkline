"use client";

import { useMemo, useState } from "react";
import type {
  ShippingCity,
  ShippingGovernorate,
} from "@/lib/shipping-store";

type SaveState = "idle" | "saving" | "saved" | "error";

export function AdminShippingManager({
  initialLocations,
}: {
  initialLocations: ShippingGovernorate[];
}) {
  const [locations, setLocations] = useState(initialLocations);
  const [activeId, setActiveId] = useState(initialLocations[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const active = locations.find((item) => item.id === activeId);

  const visibleCities = useMemo(() => {
    if (!active) return [];
    const normalized = query.trim().toLocaleLowerCase("ar");
    if (!normalized) return active.cities;
    return active.cities.filter(
      (city) =>
        city.nameAr.toLocaleLowerCase("ar").includes(normalized) ||
        city.nameEn.toLocaleLowerCase("en").includes(normalized),
    );
  }, [active, query]);

  function markChanged(next: ShippingGovernorate[]) {
    setLocations(next);
    setState("idle");
    setMessage("");
  }

  function updateGovernorate(changes: Partial<ShippingGovernorate>) {
    markChanged(
      locations.map((item) =>
        item.id === activeId ? { ...item, ...changes } : item,
      ),
    );
  }

  function updateCity(id: number, changes: Partial<ShippingCity>) {
    if (!active) return;
    updateGovernorate({
      cities: active.cities.map((city) =>
        city.id === id ? { ...city, ...changes } : city,
      ),
    });
  }

  async function save() {
    setState("saving");
    setMessage("");
    try {
      const response = await fetch("/api/admin/shipping", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(locations),
      });
      const result = (await response.json()) as {
        data?: ShippingGovernorate[];
        error?: string;
      };
      if (!response.ok || !result.data) {
        throw new Error(result.error ?? "تعذر حفظ إعدادات الشحن.");
      }
      setLocations(result.data);
      setState("saved");
      setMessage("تم حفظ أسعار الشحن ونشرها في صفحة الدفع.");
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error ? error.message : "تعذر حفظ إعدادات الشحن.",
      );
    }
  }

  if (!active) {
    return (
      <div className="admin-empty">
        <h2>لا توجد محافظات.</h2>
      </div>
    );
  }

  return (
    <div className="admin-shipping-layout">
      <aside className="admin-shipping-tabs" aria-label="اختيار المحافظة">
        {locations.map((governorate) => (
          <button
            className={governorate.id === activeId ? "is-active" : ""}
            type="button"
            key={governorate.id}
            onClick={() => {
              setActiveId(governorate.id);
              setQuery("");
            }}
          >
            <span>{governorate.nameAr}</span>
            <small>
              {governorate.shippingPrice === null
                ? "السعر غير محدد"
                : `${governorate.shippingPrice.toLocaleString("ar-EG")} ج.م`}
            </small>
          </button>
        ))}
      </aside>

      <section className="admin-panel admin-shipping-panel">
        <header className="admin-shipping-panel__header">
          <div>
            <p className="admin-eyebrow" dir="ltr">
              {active.nameEn}
            </p>
            <h2>{active.nameAr}</h2>
            <p>
              سعر المحافظة هو السعر الافتراضي. اترك سعر المدينة فارغًا لتستخدم
              هذا السعر.
            </p>
          </div>
          <label className="admin-switch">
            <input
              type="checkbox"
              checked={active.active}
              onChange={(event) =>
                updateGovernorate({ active: event.target.checked })
              }
            />
            <span>التوصيل متاح للمحافظة</span>
          </label>
        </header>

        <div className="admin-shipping-default">
          <label>
            <span>سعر الشحن الافتراضي للمحافظة</span>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={active.shippingPrice ?? ""}
              placeholder="قيد التأكيد"
              onChange={(event) =>
                updateGovernorate({
                  shippingPrice:
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                })
              }
            />
          </label>
          <label>
            <span className="sr-only">ابحث في المدن</span>
            <input
              type="search"
              value={query}
              placeholder="ابحث باسم المدينة أو المنطقة"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        <div className="admin-shipping-cities">
          <div className="admin-shipping-cities__head" aria-hidden="true">
            <span>المدينة / المنطقة</span>
            <span>سعر خاص</span>
            <span>الحالة</span>
          </div>
          {visibleCities.map((city) => (
            <article key={city.id}>
              <div>
                <b>{city.nameAr}</b>
                <small dir="ltr">{city.nameEn}</small>
              </div>
              <label>
                <span className="sr-only">سعر شحن {city.nameAr}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={city.shippingPrice ?? ""}
                  placeholder={
                    active.shippingPrice === null
                      ? "قيد التأكيد"
                      : String(active.shippingPrice)
                  }
                  onChange={(event) =>
                    updateCity(city.id, {
                      shippingPrice:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    })
                  }
                />
              </label>
              <label className="admin-switch admin-switch--compact">
                <input
                  type="checkbox"
                  checked={city.active}
                  onChange={(event) =>
                    updateCity(city.id, { active: event.target.checked })
                  }
                />
                <span>{city.active ? "متاحة" : "متوقفة"}</span>
              </label>
            </article>
          ))}
          {!visibleCities.length ? (
            <div className="admin-empty">
              <h3>لا توجد مدن مطابقة.</h3>
            </div>
          ) : null}
        </div>

        <div className="admin-sticky-actions">
          {message ? (
            <p
              className={`admin-alert admin-alert--${
                state === "error" ? "error" : "success"
              }`}
              role="status"
            >
              {message}
            </p>
          ) : (
            <span>
              الأسعار الفارغة ستظهر للعميل على أنها قيد التأكيد.
            </span>
          )}
          <button
            className="admin-primary-action"
            type="button"
            onClick={save}
            disabled={state === "saving"}
          >
            {state === "saving" ? "جاري الحفظ…" : "حفظ إعدادات الشحن"}
          </button>
        </div>
      </section>
    </div>
  );
}
