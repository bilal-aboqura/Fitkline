import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { BostaIntegrationError } from "@/lib/bosta";
import { importExistingBostaDeliveries } from "@/lib/bosta-import";

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  }

  try {
    return NextResponse.json({ data: await importExistingBostaDeliveries() });
  } catch (error) {
    if (error instanceof BostaIntegrationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("[POST /api/admin/orders/bosta/import]", error);
    return NextResponse.json(
      { error: "تعذر سحب أوردرات بوسطة حاليًا." },
      { status: 500 },
    );
  }
}
