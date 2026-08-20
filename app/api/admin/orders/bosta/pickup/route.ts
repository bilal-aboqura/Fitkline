import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { BostaIntegrationError } from "@/lib/bosta";
import { runBostaPickupAutomation } from "@/lib/bosta-pickup-automation";

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  }

  try {
    const result = await runBostaPickupAutomation({ ignoreTime: true });
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof BostaIntegrationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("[POST /api/admin/orders/bosta/pickup]", error);
    return NextResponse.json(
      { error: "تعذر إعادة تشغيل جدولة استلام بوسطة." },
      { status: 500 },
    );
  }
}
