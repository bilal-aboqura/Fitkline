import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getCmsContent, saveCmsContent } from "@/lib/cms-store";
import { validateOffers, type StoreOffer } from "@/data/offers";

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  try {
    const body = (await request.json()) as { offers?: StoreOffer[] };
    validateOffers(body.offers);
    const content = await getCmsContent();
    const next = await saveCmsContent({ ...content, offers: body.offers });
    revalidatePath("/", "layout");
    revalidatePath("/offers");
    return NextResponse.json({ data: next.offers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر حفظ العروض." }, { status: 400 });
  }
}
