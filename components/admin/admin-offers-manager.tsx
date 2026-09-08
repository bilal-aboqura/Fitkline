"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { getOfferImage, getOfferListPrice, getOfferPrice, getOfferState, type StoreOffer } from "@/data/offers";
import type { Product } from "@/data/products";

const blank = (): StoreOffer => ({ id: `offer-${Date.now().toString(36)}`, title: "باقة جديدة", description: "", active: false, status: "draft", imageUrl: "", mobileImageUrl: "", discountPercent: 0, offerPrice: null, startAt: "", endAt: "", showOnHomepage: true, showAsPopup: false, priority: 0, items: [] });

function Icon({ name }: { name: "image" | "trash" | "plus" | "publish" }) {
  const paths = { image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m21 15-5-5L5 20" /></>, trash: <><path d="M4 7h16M10 11v5m4-5v5M9 7l1-3h4l1 3m-9 0 1 14h10l1-14" /></>, plus: <><path d="M12 5v14M5 12h14" /></>, publish: <><path d="M5 12 10 17 20 7" /></> };
  return <svg className="admin-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function toDateTime(value: string) { return value ? value.slice(0, 16) : ""; }
function fromDateTime(value: string) { return value ? new Date(value).toISOString() : ""; }

export function AdminOffersManager({ initialOffers, products }: { initialOffers: StoreOffer[]; products: Product[] }) {
  const [offers, setOffers] = useState(initialOffers);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const statusLabels = { draft: "مسودة", active: "نشط", scheduled: "مجدول", expired: "منتهي", inactive: "متوقف" } as const;
  const update = (index: number, changes: Partial<StoreOffer>) => { setOffers((current) => current.map((offer, i) => i === index ? { ...offer, ...changes } : offer)); setState("idle"); };
  const addItem = (index: number) => {
    const product = products.find((candidate) => candidate.active);
    const size = product?.sizes.find((candidate) => candidate.active);
    if (product && size) update(index, { items: [...offers[index].items, { slug: product.slug, sizeId: size.id, quantity: 1 }] });
  };
  async function upload(index: number, file: File, field: "imageUrl" | "mobileImageUrl") {
    setMessage("جاري رفع الصورة…");
    const form = new FormData(); form.append("file", file);
    const response = await fetch("/api/admin/upload", { method: "POST", body: form });
    const result = await response.json() as { url?: string; error?: string };
    if (!response.ok || !result.url) { setState("error"); setMessage(result.error ?? "تعذر رفع الصورة."); return; }
    update(index, { [field]: result.url }); setMessage("تم رفع الصورة. احفظ العرض لنشرها.");
  }
  async function save() {
    setState("saving"); setMessage("");
    const response = await fetch("/api/admin/offers", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offers }) });
    const result = await response.json() as { data?: StoreOffer[]; error?: string };
    if (!response.ok || !result.data) { setState("error"); setMessage(result.error ?? "تعذر حفظ العروض."); return; }
    setOffers(result.data); setState("saved"); setMessage("تم حفظ العروض ونشر التغييرات على الموقع.");
  }
  const now = useMemo(() => new Date(), []);
  return <section className="admin-panel admin-offers">
    <div className="admin-page-heading admin-offers__heading"><div><p className="admin-eyebrow">PROMOTIONS / PACKAGES</p><h1>الباقات والعروض</h1><p>اعرض باقات قابلة للشراء مع صورها، مواعيد نشرها، ومكان ظهورها في الموقع.</p></div><button className="admin-secondary-action" type="button" onClick={() => setOffers((current) => [...current, blank()])}><Icon name="plus" /> عرض جديد</button></div>
    <div className="admin-offers__list">{offers.map((offer, index) => {
      const offerState = getOfferState(offer, now); const listPrice = getOfferListPrice(offer, products); const price = getOfferPrice(offer, products); const image = getOfferImage(offer, products);
      return <article className="admin-offer" key={offer.id}>
        <header className="admin-offer__top"><div className="admin-offer__identity"><span className={`admin-offer__status admin-offer__status--${offerState}`}>{statusLabels[offerState]}</span><strong>{offer.title || "عرض بدون اسم"}</strong></div><button type="button" className="text-button admin-danger-action" onClick={() => setOffers((current) => current.filter((_, i) => i !== index))}><Icon name="trash" /> حذف</button></header>
        <div className="admin-offer__layout"><aside className="admin-offer__media"><div className="admin-offer__preview">{image ? <Image src={image} alt="معاينة العرض" fill sizes="(max-width: 780px) 100vw, 320px" /> : <div><Icon name="image" /><span>أضف صورة بانر للعرض</span></div>}</div><label className="admin-upload"><span>صورة العرض الرئيسية</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(index, file, "imageUrl"); }} /></label><label><span>رابط الصورة</span><input dir="ltr" value={offer.imageUrl} onChange={(event) => update(index, { imageUrl: event.target.value })} /></label>{offer.imageUrl ? <button className="text-button" type="button" onClick={() => update(index, { imageUrl: "" })}>إزالة الصورة الرئيسية</button> : null}<label className="admin-upload"><span>صورة مخصصة للموبايل (اختياري)</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(index, file, "mobileImageUrl"); }} /></label>{offer.mobileImageUrl ? <button className="text-button" type="button" onClick={() => update(index, { mobileImageUrl: "" })}>إزالة صورة الموبايل</button> : null}</aside>
          <div className="admin-offer__editor"><div className="admin-form-grid"><label><span>اسم العرض</span><input value={offer.title} onChange={(event) => update(index, { title: event.target.value })} /></label><label><span>حالة النشر</span><select value={offer.status} onChange={(event) => { const status = event.target.value as StoreOffer["status"]; update(index, { status, active: status === "active" }); }}><option value="draft">مسودة</option><option value="active">نشط</option><option value="inactive">متوقف</option></select></label><label className="admin-form-grid__full"><span>وصف مختصر</span><textarea rows={3} value={offer.description} onChange={(event) => update(index, { description: event.target.value })} /></label><label><span>الخصم %</span><input type="number" min="0" max="100" value={offer.discountPercent} onChange={(event) => update(index, { discountPercent: Math.max(0, Number(event.target.value)) })} /></label><label><span>سعر الباقة الثابت (اختياري)</span><input type="number" min="0" step="0.01" value={offer.offerPrice ?? ""} placeholder="استخدم الخصم بالنسبة" onChange={(event) => update(index, { offerPrice: event.target.value === "" ? null : Number(event.target.value) })} /></label><label><span>يبدأ العرض</span><input type="datetime-local" value={toDateTime(offer.startAt)} onChange={(event) => update(index, { startAt: fromDateTime(event.target.value) })} /></label><label><span>ينتهي العرض</span><input type="datetime-local" value={toDateTime(offer.endAt)} onChange={(event) => update(index, { endAt: fromDateTime(event.target.value) })} /></label><label><span>أولوية العرض</span><input type="number" min="0" value={offer.priority} onChange={(event) => update(index, { priority: Math.max(0, Number(event.target.value)) })} /></label></div>
            <div className="admin-offer__toggles"><label className="admin-switch"><input type="checkbox" checked={offer.showOnHomepage} onChange={(event) => update(index, { showOnHomepage: event.target.checked })} /><span>اعرضه في الصفحة الرئيسية</span></label><label className="admin-switch"><input type="checkbox" checked={offer.showAsPopup} onChange={(event) => update(index, { showAsPopup: event.target.checked })} /><span>اعرضه كبانر دخول</span></label></div>
            <div className="admin-offer__price-summary"><span>القيمة الأصلية</span><b>{listPrice === null ? "غير محددة" : `${listPrice.toLocaleString("ar-EG")} ج.م`}</b><span>سعر العرض</span><strong>{price === null ? "يتأكد عند الطلب" : `${price.toLocaleString("ar-EG")} ج.م`}</strong></div>
          </div></div>
        <section className="admin-offer__items"><div className="admin-offer__items-heading"><div><h2>محتوى الباقة</h2><p>الأسعار والخصم يتم التحقق منها على الخادم عند الطلب.</p></div><button className="admin-secondary-action" type="button" onClick={() => addItem(index)}><Icon name="plus" /> أضف منتج</button></div>{offer.items.map((item, itemIndex) => <div className="admin-offer__item" key={`${item.slug}-${item.sizeId}`}><select aria-label="المنتج" value={item.slug} onChange={(event) => { const product = products.find((candidate) => candidate.slug === event.target.value)!; const size = product.sizes.find((candidate) => candidate.active)!; update(index, { items: offer.items.map((entry, i) => i === itemIndex ? { ...entry, slug: product.slug, sizeId: size.id } : entry) }); }}>{products.filter((product) => product.active).map((product) => <option value={product.slug} key={product.slug}>{product.name}</option>)}</select><select aria-label="الحجم" value={item.sizeId} onChange={(event) => update(index, { items: offer.items.map((entry, i) => i === itemIndex ? { ...entry, sizeId: event.target.value as "4kg" | "20kg" } : entry) })}>{products.find((product) => product.slug === item.slug)?.sizes.filter((size) => size.active).map((size) => <option value={size.id} key={size.id}>{size.label}</option>)}</select><input aria-label="الكمية" type="number" min="1" value={item.quantity} onChange={(event) => update(index, { items: offer.items.map((entry, i) => i === itemIndex ? { ...entry, quantity: Math.max(1, Number(event.target.value)) } : entry) })} /><button type="button" className="text-button admin-danger-action" onClick={() => update(index, { items: offer.items.filter((_, i) => i !== itemIndex) })}><Icon name="trash" /> حذف</button></div>)}</section>
      </article>;
    })}</div>
    <div className="admin-sticky-actions"><span>{message ? <p className={`admin-alert admin-alert--${state === "error" ? "error" : "success"}`} role="status">{message}</p> : null}</span><button className="admin-primary-action" type="button" onClick={() => void save()} disabled={state === "saving"}><Icon name="publish" /> {state === "saving" ? "جاري الحفظ…" : "حفظ ونشر العروض"}</button></div>
  </section>;
}
