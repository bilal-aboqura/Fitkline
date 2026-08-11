import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getCmsContent, saveCmsContent } from "@/lib/cms-store";
import type { Product } from "@/data/products";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  }
  const content = await getCmsContent();
  return NextResponse.json({ data: content.products });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  }
  try {
    const body = (await request.json()) as { products?: Product[] };
    if (!Array.isArray(body.products)) throw new Error("قائمة المنتجات غير صالحة.");
    const content = await getCmsContent();
    const next = await saveCmsContent({ ...content, products: body.products });
    revalidatePath("/", "layout");
    return NextResponse.json({ data: next.products });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "تعذر حفظ المنتجات." },
      { status: 400 },
    );
  }
}
