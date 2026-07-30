import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  getShippingLocations,
  saveShippingLocations,
} from "@/lib/shipping-store";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  }
  return NextResponse.json({
    data: await getShippingLocations({ includeInactive: true }),
  });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  }
  try {
    return NextResponse.json({
      data: await saveShippingLocations(await request.json()),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "تعذر حفظ إعدادات الشحن.",
      },
      { status: 400 },
    );
  }
}
