import { AdminContentEditor } from "@/components/admin/admin-content-editor";
import { getCmsContent } from "@/lib/cms-store";

export const metadata = { title: "محتوى الموقع" };

export default async function AdminContentPage() {
  const content = await getCmsContent();
  return (
    <>
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">تحكم كامل</p>
          <h1>محتوى الموقع</h1>
          <p>عدّل الهوية، التنقل، نصوص الهوم، إعدادات الدفع والعرض من حقول واضحة، ثم انشرها بضغطة واحدة.</p>
        </div>
      </header>
      <AdminContentEditor initialContent={content} />
    </>
  );
}
