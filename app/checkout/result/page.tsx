import Link from "next/link";
import { findOrder, updateOrder } from "@/lib/order-store";
import { inspectKashierPayment, verifyKashierSession } from "@/lib/kashier";
import { MetaPurchaseEvent } from "@/components/analytics/meta-purchase-event";
import { getOnlinePaymentAmount, getAmountDueOnDelivery } from "@/lib/order-payment";

export const metadata = { title: "نتيجة الدفع" };

export default async function CheckoutResultPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: reference = "" } = await searchParams;
  let order = reference ? await findOrder(reference) : null;

  if (
    order?.paymentStatus === "pending" &&
    order.kashierSessionId &&
    getOnlinePaymentAmount(order) !== null
  ) {
    try {
      const verified = await verifyKashierSession(order.kashierSessionId);
      const inspection = inspectKashierPayment(verified, {
        sessionId: order.kashierSessionId,
        reference: order.reference,
        amount: getOnlinePaymentAmount(order)!,
        currency: order.currency,
      });
      if (!inspection.integrityValid) {
        throw new Error("Kashier payment integrity mismatch");
      }
      order = await updateOrder(order.reference, {
        paymentStatus: inspection.paid
          ? "paid"
          : inspection.failed
            ? "failed"
            : "pending",
        kashierPaymentId: inspection.paymentId,
      });
    } catch {
      // The webhook can still complete this order; keep the honest pending state.
    }
  }

  const paid = order?.paymentStatus === "paid";
  const failed = order?.paymentStatus === "failed";
  const shippingOnly = order?.paymentMethod === "cod";
  const dueOnDelivery = order ? getAmountDueOnDelivery(order) : null;

  return (
    <main id="main-content" className="standard-page">
      {paid && order && order.total !== null ? (
        <MetaPurchaseEvent
          reference={order.reference}
          value={order.total}
          currency={order.currency}
          items={order.items}
        />
      ) : null}
      <section className="page-hero page-hero--redesign page-hero--compact">
        <div className="fit-container page-hero__inner">
          <p className="section-heading__kicker" dir="ltr">KASHIER / PAYMENT</p>
          <h1>{paid ? shippingOnly ? "الشحن اتدفع بنجاح." : "الدفع تم بنجاح." : failed ? "الدفع لم يكتمل." : "الدفع قيد التأكيد."}</h1>
          <p>
            {paid
              ? `تم تسجيل طلبك ${order?.reference ?? ""}، وفريق Fitkline هيبدأ المتابعة.`
              : failed
                ? "الدفع لم يكتمل. احتفظ برقم الطلب وتواصل مع الفريق لاستكماله."
                : "نراجع حالة العملية مع كاشير. احتفظ برقم الطلب وراجع الصفحة بعد لحظات."}
          </p>
          {paid && shippingOnly ? <p>قيمة المنتجات عند الاستلام: {dueOnDelivery === null ? "الفريق هيأكدها معاك قبل التنفيذ" : `${dueOnDelivery.toLocaleString("ar-EG")} ج.م`}. الشحن مدفوع ومش هيتحصّل منك مرة تانية.</p> : null}
          <div className="page-actions">
            <Link className="fit-button-primary" href={failed ? "/contact" : "/products"}>
              {failed ? "تواصل لاستكمال الدفع" : "ارجع للمنتجات"}
            </Link>
            <Link className="fit-button-secondary" href={failed ? "/checkout" : "/contact"}>{failed ? "ابدأ طلب جديد" : "تواصل مع الفريق"}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
