import { isAdminAuthenticated } from "@/lib/admin-auth";
import { downloadMylerzAwb, MylerzIntegrationError } from "@/lib/mylerz";
import { findOrder } from "@/lib/order-store";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return Response.json({ error: "غير مصرح." }, { status: 401 });
  try {
    const reference = new URL(request.url).searchParams.get("reference")?.trim();
    if (!reference) return Response.json({ error: "رقم الطلب غير صالح." }, { status: 400 });
    const order = await findOrder(reference);
    if (!order?.mylerz?.trackingNumber) return Response.json({ error: "الطلب غير مربوط بشحنة Mylerz." }, { status: 404 });
    const pdf = await downloadMylerzAwb(order.mylerz.trackingNumber);
    return new Response(pdf, { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="mylerz-${order.mylerz.trackingNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    }});
  } catch (error) {
    if (error instanceof MylerzIntegrationError) return Response.json({ error: error.message }, { status: error.status });
    console.error("[GET /api/admin/orders/mylerz/awb]", error);
    return Response.json({ error: "تعذر تنزيل بوليصة Mylerz." }, { status: 500 });
  }
}
