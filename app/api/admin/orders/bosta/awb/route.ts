import { isAdminAuthenticated } from "@/lib/admin-auth";
import { BostaIntegrationError, downloadBostaAwb } from "@/lib/bosta";
import { findOrder } from "@/lib/order-store";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "غير مصرح." }, { status: 401 });
  }

  try {
    const reference = new URL(request.url).searchParams.get("reference")?.trim();
    if (!reference) {
      return Response.json({ error: "رقم الطلب غير صالح." }, { status: 400 });
    }
    const order = await findOrder(reference);
    if (!order?.bosta?.trackingNumber) {
      return Response.json(
        { error: "الطلب غير مربوط بشحنة بوسطة." },
        { status: 404 },
      );
    }
    const pdf = await downloadBostaAwb(order.bosta.trackingNumber);
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="bosta-${order.bosta.trackingNumber}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof BostaIntegrationError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[GET /api/admin/orders/bosta/awb]", error);
    return Response.json(
      { error: "تعذر تنزيل بوليصة بوسطة." },
      { status: 500 },
    );
  }
}
