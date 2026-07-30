import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const allowedTypes = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "اختر ملف صورة." }, { status: 400 });
  }
  const extension = allowedTypes.get(file.type);
  if (!extension) {
    return NextResponse.json({ error: "الصيغ المتاحة PNG أو JPG أو WebP." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "حجم الصورة يجب ألا يتجاوز 10MB." }, { status: 400 });
  }

  const filename = `${crypto.randomUUID()}.${extension}`;
  const objectPath = `uploads/${new Date().getUTCFullYear()}/${filename}`;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.storage
    .from("fitkline-assets")
    .upload(objectPath, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
  if (error) {
    return NextResponse.json(
      { error: "تعذر رفع الصورة إلى التخزين الدائم." },
      { status: 500 },
    );
  }
  const { data } = supabase.storage
    .from("fitkline-assets")
    .getPublicUrl(objectPath);
  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}
