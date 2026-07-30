"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product, ProductSize } from "@/data/products";

function lines(value: readonly string[]) {
  return value.join("\n");
}

function fromLines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

export function AdminProductManager({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [activeSlug, setActiveSlug] = useState(initialProducts[0]?.slug ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const product = products.find((item) => item.slug === activeSlug);

  function updateProduct(changes: Partial<Product>) {
    setProducts((current) =>
      current.map((item) => item.slug === activeSlug ? { ...item, ...changes } : item),
    );
    setState("idle");
  }

  function updateSlug(nextSlug: string) {
    setProducts((current) =>
      current.map((item) =>
        item.slug === activeSlug ? { ...item, slug: nextSlug } : item,
      ),
    );
    setActiveSlug(nextSlug);
    setState("idle");
  }

  function updateSize(id: ProductSize["id"], changes: Partial<ProductSize>) {
    if (!product) return;
    updateProduct({
      sizes: product.sizes.map((size) => size.id === id ? { ...size, ...changes } : size),
    });
  }

  async function upload(file: File, sizeId: "4kg" | "20kg") {
    setMessage("جاري رفع الصورة…");
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/admin/upload", { method: "POST", body: form });
    const result = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !result.url) {
      setState("error");
      setMessage(result.error ?? "تعذر رفع الصورة.");
      return;
    }
    if (!product) return;
    const sizeImages = { ...product.sizeImages, [sizeId]: result.url };
    updateProduct({
      sizeImages,
      ...(sizeId === "4kg" ? { image: result.url, catalogImage: result.url } : {}),
    });
    setMessage("تم رفع الصورة. اضغط حفظ المنتجات لنشرها.");
  }

  async function save() {
    setState("saving");
    setMessage("");
    const response = await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products }),
    });
    const result = (await response.json()) as { data?: Product[]; error?: string };
    if (!response.ok || !result.data) {
      setState("error");
      setMessage(result.error ?? "تعذر حفظ المنتجات.");
      return;
    }
    setProducts(result.data);
    setState("saved");
    setMessage("تم حفظ المنتجات ونشرها على الموقع.");
  }

  if (!product) return <div className="admin-empty"><h2>لا توجد منتجات.</h2></div>;

  return (
    <div className="admin-products-layout">
      <aside className="admin-product-tabs" aria-label="اختيار المنتج">
        {products.map((item) => (
          <button
            className={item.slug === activeSlug ? "is-active" : ""}
            type="button"
            key={item.slug}
            onClick={() => setActiveSlug(item.slug)}
          >
            <span dir="ltr">{item.name}</span>
            <small>{item.active ? "ظاهر على الموقع" : "مخفي"}</small>
          </button>
        ))}
      </aside>

      <section className="admin-panel admin-product-form">
        <div className="admin-product-form__headline">
          <div><p className="admin-eyebrow" dir="ltr">{product.step} / 03</p><h2 dir="ltr">{product.name}</h2></div>
          <label className="admin-switch">
            <input type="checkbox" checked={product.active} onChange={(event) => updateProduct({ active: event.target.checked })} />
            <span>ظاهر على الموقع</span>
          </label>
        </div>

        <div className="admin-form-grid">
          <label><span>اسم المنتج</span><input dir="ltr" value={product.name} onChange={(e) => updateProduct({ name: e.target.value })} /></label>
          <label><span>رابط صفحة المنتج</span><input dir="ltr" value={product.slug} onChange={(e) => updateSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} /></label>
          <label><span>ترتيب المنتج</span><input dir="ltr" value={product.step} onChange={(e) => updateProduct({ step: e.target.value })} /></label>
          <label><span>الفئة</span><input value={product.category} onChange={(e) => updateProduct({ category: e.target.value })} /></label>
          <label><span>الكلمة الرئيسية</span><input value={product.action} onChange={(e) => updateProduct({ action: e.target.value })} /></label>
          <label><span>النص المختصر</span><input value={product.shortDescription} onChange={(e) => updateProduct({ shortDescription: e.target.value })} /></label>
          <label className="admin-form-grid__full"><span>وصف الصورة لقارئ الشاشة وSEO</span><input value={product.imageAlt} onChange={(e) => updateProduct({ imageAlt: e.target.value })} /></label>
          <label className="admin-form-grid__full"><span>رسالة السعر عندما لا يكون محددًا</span><input value={product.priceLabel} onChange={(e) => updateProduct({ priceLabel: e.target.value })} /></label>
          <label className="admin-form-grid__full"><span>وصف المنتج</span><textarea rows={4} value={product.description} onChange={(e) => updateProduct({ description: e.target.value })} /></label>
          <label className="admin-form-grid__full"><span>المميزات — سطر لكل ميزة</span><textarea rows={4} value={lines(product.benefits)} onChange={(e) => updateProduct({ benefits: fromLines(e.target.value) })} /></label>
          <label className="admin-form-grid__full"><span>الاستخدامات — سطر لكل استخدام</span><textarea rows={3} value={lines(product.useCases)} onChange={(e) => updateProduct({ useCases: fromLines(e.target.value) })} /></label>
          <label className="admin-form-grid__full"><span>طريقة الاستخدام — سطر لكل خطوة</span><textarea rows={4} value={lines(product.howToUse)} onChange={(e) => updateProduct({ howToUse: fromLines(e.target.value) })} /></label>
          <label className="admin-form-grid__full"><span>السلامة — سطر لكل تعليمات</span><textarea rows={4} value={lines(product.safety)} onChange={(e) => updateProduct({ safety: fromLines(e.target.value) })} /></label>
        </div>

        <div className="admin-size-grid">
          {product.sizes.map((size) => {
            const imageUrl = product.sizeImages[size.id] ?? product.image;
            return (
              <article key={size.id}>
                <div className="admin-size-grid__preview">
                  <Image src={imageUrl} alt="" width={280} height={360} />
                </div>
                <div>
                  <h3>{size.label}</h3>
                  <label><span>اسم الحجم الظاهر</span><input value={size.label} onChange={(e) => updateSize(size.id, { label: e.target.value })} /></label>
                  <label><span>السعر بالجنيه</span><input type="number" min="0" step="0.01" value={size.price ?? ""} onChange={(e) => updateSize(size.id, { price: e.target.value === "" ? null : Number(e.target.value) })} /></label>
                  <label><span>المخزون — اختياري</span><input type="number" min="0" value={size.stock ?? ""} onChange={(e) => updateSize(size.id, { stock: e.target.value === "" ? null : Number(e.target.value) })} /></label>
                  <label className="admin-switch"><input type="checkbox" checked={size.active} onChange={(e) => updateSize(size.id, { active: e.target.checked })} /><span>الحجم متاح</span></label>
                  <label className="admin-upload"><span>استبدل الصورة</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file, size.id); }} /></label>
                  <label><span>رابط الصورة</span><input dir="ltr" value={imageUrl} onChange={(e) => { const sizeImages = { ...product.sizeImages, [size.id]: e.target.value }; updateProduct({ sizeImages, ...(size.id === "4kg" ? { image: e.target.value, catalogImage: e.target.value } : {}) }); }} /></label>
                </div>
              </article>
            );
          })}
        </div>

        <div className="admin-sticky-actions">
          {message ? <p className={`admin-alert admin-alert--${state === "error" ? "error" : "success"}`} role="status">{message}</p> : <span />}
          <button className="admin-primary-action" type="button" onClick={save} disabled={state === "saving"}>
            {state === "saving" ? "جاري الحفظ…" : "حفظ المنتجات"}
          </button>
        </div>
      </section>
    </div>
  );
}
