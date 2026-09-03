"use client";

import { useState } from "react";
import type { StoreOffer } from "@/data/offers";
import type { Product } from "@/data/products";

const blank = (): StoreOffer => ({ id: `offer-${Date.now().toString(36)}`, title: "باقة جديدة", description: "", active: false, discountPercent: 0, items: [] });

export function AdminOffersManager({ initialOffers, products }: { initialOffers: StoreOffer[]; products: Product[] }) {
  const [offers, setOffers] = useState(initialOffers);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const update = (index: number, changes: Partial<StoreOffer>) => setOffers(current => current.map((offer, i) => i === index ? { ...offer, ...changes } : offer));
  const addItem = (index: number) => {
    const product = products[0]; const size = product?.sizes.find(item => item.active);
    if (product && size) update(index, { items: [...offers[index].items, { slug: product.slug, sizeId: size.id, quantity: 1 }] });
  };
  async function save() {
    setState("saving");
    const response = await fetch("/api/admin/offers", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offers }) });
    const result = await response.json() as { data?: StoreOffer[]; error?: string };
    if (!response.ok || !result.data) { setState("error"); setMessage(result.error ?? "تعذر حفظ العروض."); return; }
    setOffers(result.data); setState("saved"); setMessage("تم حفظ الباقات والعروض ونشرها على الموقع.");
  }
  return <section className="admin-panel admin-offers"><div className="admin-page-heading"><p className="admin-eyebrow">PROMOTIONS</p><h1>الباقات والعروض</h1><p>كل باقة تُضاف كسلة جاهزة، والخصم يُحسب من الأسعار الحالية عند إتمام الطلب.</p></div>
    <div className="admin-offers__list">{offers.map((offer, index) => <article className="admin-offer" key={offer.id}>
      <div className="admin-offer__top"><label className="admin-switch"><input type="checkbox" checked={offer.active} onChange={e => update(index, { active: e.target.checked })} /><span>العرض ظاهر ومُفعّل</span></label><button type="button" className="text-button" onClick={() => setOffers(current => current.filter((_, i) => i !== index))}>حذف العرض</button></div>
      <div className="admin-form-grid"><label><span>اسم الباقة</span><input value={offer.title} onChange={e => update(index, { title: e.target.value })} /></label><label><span>نسبة الخصم %</span><input type="number" min="0" max="100" value={offer.discountPercent} onChange={e => update(index, { discountPercent: Number(e.target.value) })} /></label><label className="admin-form-grid__full"><span>وصف مختصر</span><input value={offer.description} onChange={e => update(index, { description: e.target.value })} /></label></div>
      <div className="admin-offer__items">{offer.items.map((item, itemIndex) => <div className="admin-offer__item" key={`${item.slug}-${itemIndex}`}><select value={item.slug} onChange={e => { const product = products.find(p => p.slug === e.target.value)!; const size = product.sizes.find(s => s.active)!; update(index, { items: offer.items.map((entry, i) => i === itemIndex ? { ...entry, slug: product.slug, sizeId: size.id } : entry) }); }}>{products.map(product => <option value={product.slug} key={product.slug}>{product.name}</option>)}</select><select value={item.sizeId} onChange={e => update(index, { items: offer.items.map((entry, i) => i === itemIndex ? { ...entry, sizeId: e.target.value as "4kg" | "20kg" } : entry) })}>{products.find(p => p.slug === item.slug)?.sizes.filter(size => size.active).map(size => <option value={size.id} key={size.id}>{size.label}</option>)}</select><input aria-label="الكمية" type="number" min="1" value={item.quantity} onChange={e => update(index, { items: offer.items.map((entry, i) => i === itemIndex ? { ...entry, quantity: Math.max(1, Number(e.target.value)) } : entry) })} /><button type="button" className="text-button" onClick={() => update(index, { items: offer.items.filter((_, i) => i !== itemIndex) })}>حذف</button></div>)}<button className="admin-secondary-action" type="button" onClick={() => addItem(index)}>+ أضف منتج للباقة</button></div>
    </article>)}</div>
    <div className="admin-sticky-actions"><span>{message && <p className={`admin-alert admin-alert--${state === "error" ? "error" : "success"}`} role="status">{message}</p>}</span><div><button className="admin-secondary-action" type="button" onClick={() => setOffers(current => [...current, blank()])}>باقة جديدة</button><button className="admin-primary-action" type="button" onClick={() => void save()} disabled={state === "saving"}>{state === "saving" ? "جاري الحفظ…" : "حفظ العروض"}</button></div></div>
  </section>;
}
