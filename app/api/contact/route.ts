import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const required = ["name", "phone", "facility", "facilityType", "governorate", "message"];
  const missing = required.filter((field) => typeof body[field] !== "string" || !body[field]);

  if (missing.length) {
    return NextResponse.json({ error: "من فضلك كمّل البيانات الأساسية.", missing }, { status: 400 });
  }

  return NextResponse.json({
    received: true,
    reference: `FTK-CONTACT-${Date.now().toString(36).toUpperCase()}`,
    note: "اربط هذا المسار بخدمة CRM أو البريد قبل الإطلاق التجاري.",
  });
}
