import { NextResponse } from "next/server";
import { getCustomerLoyalty } from "@/lib/customer-loyalty-store";
import { isEgyptianMobile } from "@/lib/customer-loyalty";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();
    if (!isEgyptianMobile(phone)) {
      return NextResponse.json({ error: "اكتب رقم موبايل مصري صحيح." }, { status: 400 });
    }
    const loyalty = await getCustomerLoyalty(phone);
    // Only expose the checkout benefit, never the customer's order history.
    return NextResponse.json({ eligible: loyalty.eligible }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "تعذر التحقق من ميزة عميل Fitkline. حاول مرة أخرى." }, { status: 503 });
  }
}
