"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type {
  CmsContent,
  HomeContent,
  PagesContent,
  SiteSettings,
} from "@/lib/cms-store";

type SaveState = "idle" | "saving" | "saved" | "error";
type HomeSection = Exclude<keyof HomeContent, "heroScenes">;

const homeSectionLabels: Record<HomeSection, string> = {
  system: "سيكشن نظام المنتجات",
  directory: "سيكشن ثلاثة حلول",
  benefits: "سيكشن مميزات الأداء",
  quote: "الدعوة النهائية للتواصل",
};

const homeFieldLabels: Record<string, string> = {
  label: "النص التعريفي",
  kicker: "النص الصغير",
  title: "العنوان الرئيسي",
  accent: "الجزء الأخضر من العنوان",
  description: "الوصف",
  lead: "النص التمهيدي",
};

type ContentPath = Array<string | number>;

const pageSectionLabels: Record<keyof PagesContent, string> = {
  about: "صفحة عن Fitkline",
  faq: "صفحة الأسئلة الشائعة",
  contact: "صفحة التواصل والنموذج",
  privacy: "سياسة الخصوصية",
  terms: "الشروط والأحكام",
};

const pageFieldLabels: Record<string, string> = {
  heroTitle: "عنوان الصفحة",
  heroAccent: "الجزء الأخضر من العنوان",
  heroDescription: "وصف بداية الصفحة",
  kicker: "النص الصغير",
  sectionTitle: "عنوان المحتوى",
  paragraphs: "الفقرات",
  ctaLabel: "نص زر التواصل",
  principles: "المبادئ",
  title: "العنوان",
  description: "الوصف",
  items: "الأسئلة والإجابات",
  question: "السؤال",
  answer: "الإجابة",
  intro: "النص التمهيدي",
  notes: "خطوات التواصل",
  form: "نصوص نموذج التواصل",
  nameLabel: "حقل الاسم",
  phoneLabel: "حقل رقم الموبايل",
  facilityLabel: "حقل اسم المنشأة",
  facilityTypeLabel: "حقل نوع المكان",
  facilityTypePlaceholder: "الاختيار الافتراضي لنوع المكان",
  facilityTypeOptions: "خيارات نوع المكان",
  value: "القيمة الداخلية",
  label: "النص الظاهر",
  governorateLabel: "حقل المحافظة",
  areaLabel: "حقل المساحة",
  areaPlaceholder: "مثال المساحة",
  messageLabel: "حقل الرسالة",
  submitLabel: "نص زر الإرسال",
  successTitle: "عنوان نجاح الإرسال",
  successDescription: "رسالة نجاح الإرسال",
  errorMessage: "رسالة الخطأ",
  sections: "أجزاء الصفحة",
  body: "النص",
};

function PageContentFields({
  value,
  path,
  onChange,
}: {
  value: unknown;
  path: ContentPath;
  onChange: (path: ContentPath, value: unknown) => void;
}) {
  const fieldName = String(path.at(-1) ?? "");
  const label = pageFieldLabels[fieldName] ?? fieldName;

  if (typeof value === "string") {
    const isLong =
      value.length > 72 ||
      [
        "heroDescription",
        "description",
        "answer",
        "intro",
        "body",
        "successDescription",
        "errorMessage",
      ].includes(fieldName);
    return (
      <label className={isLong ? "admin-page-field is-wide" : "admin-page-field"}>
        <span>{label}</span>
        {isLong ? (
          <textarea
            rows={4}
            value={value}
            onChange={(event) => onChange(path, event.target.value)}
          />
        ) : (
          <input
            dir={fieldName === "value" ? "ltr" : undefined}
            value={value}
            onChange={(event) => onChange(path, event.target.value)}
          />
        )}
      </label>
    );
  }

  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "string")) {
      return (
        <label className="admin-page-field is-wide">
          <span>{label} — كل سطر عنصر مستقل</span>
          <textarea
            rows={Math.max(4, value.length + 1)}
            value={value.join("\n")}
            onChange={(event) =>
              onChange(
                path,
                event.target.value
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean),
              )
            }
          />
        </label>
      );
    }

    return (
      <fieldset className="admin-page-group is-wide">
        <legend>{label}</legend>
        <div className="admin-page-repeat">
          {value.map((item, index) => (
            <article key={index}>
              <b dir="ltr">ITEM {String(index + 1).padStart(2, "0")}</b>
              <div className="admin-page-grid">
                <PageContentFields
                  value={item}
                  path={[...path, index]}
                  onChange={onChange}
                />
              </div>
            </article>
          ))}
        </div>
      </fieldset>
    );
  }

  if (value && typeof value === "object") {
    return (
      <>
        {Object.entries(value).map(([key, item]) => (
          <PageContentFields
            key={key}
            value={item}
            path={[...path, key]}
            onChange={onChange}
          />
        ))}
      </>
    );
  }

  return null;
}

export function AdminContentEditor({
  initialContent,
}: {
  initialContent: CmsContent;
}) {
  const [content, setContent] = useState(initialContent);
  const [state, setState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedValue, setAdvancedValue] = useState("");

  const revisionLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("ar-EG", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(content.updatedAt)),
    [content.updatedAt],
  );

  function markChanged(next: CmsContent) {
    setContent(next);
    setState("idle");
    setMessage("");
    if (advancedOpen) setAdvancedValue(JSON.stringify(next, null, 2));
  }

  function updateSettings(patch: Partial<SiteSettings>) {
    markChanged({
      ...content,
      settings: { ...content.settings, ...patch },
    });
  }

  function updateHeroScene(
    index: number,
    field: keyof HomeContent["heroScenes"][number],
    value: string,
  ) {
    const heroScenes = content.home.heroScenes.map((scene, sceneIndex) =>
      sceneIndex === index ? { ...scene, [field]: value } : scene,
    );
    markChanged({ ...content, home: { ...content.home, heroScenes } });
  }

  function updateHomeSection(
    section: HomeSection,
    field: string,
    value: string,
  ) {
    markChanged({
      ...content,
      home: {
        ...content.home,
        [section]: { ...content.home[section], [field]: value },
      },
    });
  }

  function updateNavigation(
    index: number,
    field: "href" | "label",
    value: string,
  ) {
    const navigation = content.navigation.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item,
    );
    markChanged({ ...content, navigation });
  }

  function updatePageValue(path: ContentPath, value: unknown) {
    const pages = JSON.parse(JSON.stringify(content.pages)) as PagesContent;
    let target: unknown = pages;
    for (let index = 0; index < path.length - 1; index += 1) {
      target = (target as Record<string | number, unknown>)[path[index]];
    }
    (target as Record<string | number, unknown>)[path.at(-1)!] = value;
    markChanged({ ...content, pages });
  }

  async function uploadLogo(file: File) {
    setState("saving");
    setMessage("جاري رفع اللوجو…");
    const form = new FormData();
    form.append("file", file);
    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      const result = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "تعذر رفع اللوجو.");
      }
      updateSettings({ logoUrl: result.url });
      setMessage("تم رفع اللوجو. اضغط «حفظ ونشر» لتطبيقه.");
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error ? error.message : "تعذر رفع اللوجو.",
      );
    }
  }

  async function save() {
    setState("saving");
    setMessage("");
    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const result = (await response.json()) as {
        data?: CmsContent;
        error?: string;
      };
      if (!response.ok || !result.data) {
        throw new Error(result.error ?? "تعذر حفظ المحتوى.");
      }
      setContent(result.data);
      if (advancedOpen) {
        setAdvancedValue(JSON.stringify(result.data, null, 2));
      }
      setState("saved");
      setMessage("تم الحفظ والنشر. التغييرات ظهرت على الموقع.");
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error ? error.message : "تعذر حفظ المحتوى.",
      );
    }
  }

  function openAdvancedEditor() {
    const nextOpen = !advancedOpen;
    setAdvancedOpen(nextOpen);
    if (nextOpen) setAdvancedValue(JSON.stringify(content, null, 2));
  }

  function applyAdvancedJson() {
    try {
      const parsed = JSON.parse(advancedValue) as CmsContent;
      setContent(parsed);
      setState("idle");
      setMessage("تم تطبيق المستند داخل النموذج. راجعه ثم اضغط «حفظ ونشر».");
    } catch {
      setState("error");
      setMessage("صيغة JSON غير صحيحة. راجع الأقواس والفواصل.");
    }
  }

  return (
    <div className="admin-content-builder">
      <section className="admin-panel admin-content-builder__summary">
        <div>
          <p className="admin-eyebrow">CONTENT CONTROL</p>
          <h2>تحكم واضح من غير أكواد</h2>
          <p>
            عدّل الهوية، بيانات التواصل، القائمة، وكل عناوين ونصوص الصفحة
            الرئيسية من الحقول التالية.
          </p>
        </div>
        <dl>
          <div>
            <dt>آخر تحديث</dt>
            <dd>{revisionLabel}</dd>
          </div>
          <div>
            <dt>رقم النسخة</dt>
            <dd dir="ltr">REV {content.revision}</dd>
          </div>
        </dl>
      </section>

      <details className="admin-panel admin-content-section" open>
        <summary>
          <span>
            <b>الهوية وبيانات التواصل</b>
            <small>اللوجو، الاسم، الشعار، التواصل، الشحن والدفع</small>
          </span>
          <span aria-hidden="true">+</span>
        </summary>
        <div className="admin-content-section__body">
          <div className="admin-brand-editor">
            <div className="admin-brand-editor__preview">
              <Image
                src={content.settings.logoUrl}
                alt={content.settings.siteName}
                width={360}
                height={220}
              />
            </div>
            <label className="admin-upload">
              <span>ارفع لوجو جديد</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadLogo(file);
                }}
              />
            </label>
          </div>

          <div className="admin-form-grid">
            <label>
              <span>اسم الموقع</span>
              <input
                value={content.settings.siteName}
                onChange={(event) =>
                  updateSettings({ siteName: event.target.value })
                }
              />
            </label>
            <label>
              <span>رابط اللوجو</span>
              <input
                dir="ltr"
                value={content.settings.logoUrl}
                onChange={(event) =>
                  updateSettings({ logoUrl: event.target.value })
                }
              />
            </label>
            <label className="admin-form-grid__full">
              <span>جملة البراند في الفوتر</span>
              <input
                value={content.settings.tagline}
                onChange={(event) =>
                  updateSettings({ tagline: event.target.value })
                }
              />
            </label>
            <label>
              <span>رقم الهاتف</span>
              <input
                dir="ltr"
                type="tel"
                value={content.settings.phone}
                onChange={(event) =>
                  updateSettings({ phone: event.target.value })
                }
              />
            </label>
            <label>
              <span>واتساب</span>
              <input
                dir="ltr"
                type="tel"
                value={content.settings.whatsapp}
                onChange={(event) =>
                  updateSettings({ whatsapp: event.target.value })
                }
              />
            </label>
            <label>
              <span>البريد الإلكتروني</span>
              <input
                dir="ltr"
                type="email"
                value={content.settings.email}
                onChange={(event) =>
                  updateSettings({ email: event.target.value })
                }
              />
            </label>
            <label>
              <span>العنوان</span>
              <input
                value={content.settings.address}
                onChange={(event) =>
                  updateSettings({ address: event.target.value })
                }
              />
            </label>
            <label className="admin-form-grid__full">
              <span>ملاحظة الشحن</span>
              <input
                value={content.settings.shippingNote}
                onChange={(event) =>
                  updateSettings({ shippingNote: event.target.value })
                }
              />
            </label>
          </div>

          <div className="admin-toggle-grid">
            <label className="admin-switch">
              <input
                type="checkbox"
                checked={content.settings.cashOnDeliveryEnabled}
                onChange={(event) =>
                  updateSettings({
                    cashOnDeliveryEnabled: event.target.checked,
                  })
                }
              />
              <span>الدفع عند الاستلام ظاهر</span>
            </label>
            <label className="admin-switch">
              <input
                type="checkbox"
                checked={content.settings.kashierEnabled}
                onChange={(event) =>
                  updateSettings({ kashierEnabled: event.target.checked })
                }
              />
              <span>الدفع الإلكتروني عبر Kashier ظاهر</span>
            </label>
          </div>
        </div>
      </details>

      <details className="admin-panel admin-content-section" open>
        <summary>
          <span>
            <b>القائمة الرئيسية</b>
            <small>اسم ورابط كل عنصر في الهيدر والفوتر</small>
          </span>
          <span aria-hidden="true">+</span>
        </summary>
        <div className="admin-content-section__body admin-repeat-list">
          {content.navigation.map((item, index) => (
            <div className="admin-repeat-row" key={`${item.href}-${index}`}>
              <span dir="ltr">{String(index + 1).padStart(2, "0")}</span>
              <label>
                <span>الاسم</span>
                <input
                  value={item.label}
                  onChange={(event) =>
                    updateNavigation(index, "label", event.target.value)
                  }
                />
              </label>
              <label>
                <span>الرابط</span>
                <input
                  dir="ltr"
                  value={item.href}
                  onChange={(event) =>
                    updateNavigation(index, "href", event.target.value)
                  }
                />
              </label>
            </div>
          ))}
        </div>
      </details>

      <details className="admin-panel admin-content-section" open>
        <summary>
          <span>
            <b>مشاهد بداية الصفحة</b>
            <small>النصوص الثلاثة فوق فيديو الهوم</small>
          </span>
          <span aria-hidden="true">+</span>
        </summary>
        <div className="admin-content-section__body admin-scene-grid">
          {content.home.heroScenes.map((scene, index) => (
            <article key={index}>
              <div className="admin-scene-grid__number" dir="ltr">
                SCENE {String(index + 1).padStart(2, "0")}
              </div>
              {(
                Object.keys(scene) as Array<
                  keyof HomeContent["heroScenes"][number]
                >
              ).map((field) => (
                <label key={field}>
                  <span>{homeFieldLabels[field] ?? field}</span>
                  {field === "description" ? (
                    <textarea
                      rows={3}
                      value={scene[field]}
                      onChange={(event) =>
                        updateHeroScene(index, field, event.target.value)
                      }
                    />
                  ) : (
                    <input
                      value={scene[field]}
                      onChange={(event) =>
                        updateHeroScene(index, field, event.target.value)
                      }
                    />
                  )}
                </label>
              ))}
            </article>
          ))}
        </div>
      </details>

      {(Object.keys(homeSectionLabels) as HomeSection[]).map((section) => (
        <details
          className="admin-panel admin-content-section"
          key={section}
          open
        >
          <summary>
            <span>
              <b>{homeSectionLabels[section]}</b>
              <small>كل النصوص الظاهرة في هذا الجزء من الصفحة</small>
            </span>
            <span aria-hidden="true">+</span>
          </summary>
          <div className="admin-content-section__body admin-form-grid">
            {Object.entries(content.home[section]).map(([field, value]) => (
              <label
                className={
                  field === "description" || field === "lead"
                    ? "admin-form-grid__full"
                    : ""
                }
                key={field}
              >
                <span>{homeFieldLabels[field] ?? field}</span>
                {field === "description" || field === "lead" ? (
                  <textarea
                    rows={4}
                    value={value}
                    onChange={(event) =>
                      updateHomeSection(section, field, event.target.value)
                    }
                  />
                ) : (
                  <input
                    value={value}
                    onChange={(event) =>
                      updateHomeSection(section, field, event.target.value)
                    }
                  />
                )}
              </label>
            ))}
          </div>
        </details>
      ))}

      <details className="admin-panel admin-content-section" open>
        <summary>
          <span>
            <b>صفحات الموقع الداخلية</b>
            <small>
              عن Fitkline، الأسئلة الشائعة، التواصل، الخصوصية والشروط
            </small>
          </span>
          <span aria-hidden="true">+</span>
        </summary>
        <div className="admin-content-section__body admin-page-sections">
          {(Object.keys(pageSectionLabels) as Array<keyof PagesContent>).map(
            (section) => (
              <section className="admin-page-section" key={section}>
                <div className="admin-page-section__heading">
                  <span dir="ltr">
                    PAGE{" "}
                    {String(
                      (Object.keys(pageSectionLabels) as Array<
                        keyof PagesContent
                      >).indexOf(section) + 1,
                    ).padStart(2, "0")}
                  </span>
                  <h3>{pageSectionLabels[section]}</h3>
                </div>
                <div className="admin-page-grid">
                  <PageContentFields
                    value={content.pages[section]}
                    path={[section]}
                    onChange={updatePageValue}
                  />
                </div>
              </section>
            ),
          )}
        </div>
      </details>

      <details
        className="admin-panel admin-content-section admin-content-section--advanced"
        open={advancedOpen}
        onToggle={(event) => {
          const isOpen = event.currentTarget.open;
          if (isOpen !== advancedOpen) openAdvancedEditor();
        }}
      >
        <summary>
          <span>
            <b>التحكم المتقدم</b>
            <small>مستند JSON الكامل للحالات الخاصة فقط</small>
          </span>
          <span aria-hidden="true">+</span>
        </summary>
        <div className="admin-content-section__body">
          <label className="admin-code-field">
            <span className="sr-only">محتوى الموقع بصيغة JSON</span>
            <textarea
              dir="ltr"
              spellCheck={false}
              value={advancedValue}
              onChange={(event) => setAdvancedValue(event.target.value)}
            />
          </label>
          <button
            className="admin-secondary-action"
            type="button"
            onClick={applyAdvancedJson}
          >
            تطبيق المستند على النموذج
          </button>
        </div>
      </details>

      <div className="admin-save-dock">
        <div>
          <b>
            {state === "saving"
              ? "جاري الحفظ…"
              : state === "saved"
                ? "آخر تعديل محفوظ"
                : "راجع التعديلات قبل النشر"}
          </b>
          {message ? (
            <span className={state === "error" ? "is-error" : ""}>
              {message}
            </span>
          ) : (
            <span>المنتجات والأسعار والصور لها شاشة مستقلة.</span>
          )}
        </div>
        <button
          className="admin-primary-action"
          type="button"
          onClick={save}
          disabled={state === "saving"}
        >
          {state === "saving" ? "جاري الحفظ…" : "حفظ ونشر"}
        </button>
      </div>
    </div>
  );
}
