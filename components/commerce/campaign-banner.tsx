"use client";

import Link from "next/link";
import { saleCampaign, isSaleAvailable } from "@/data/campaign";
import { useCampaign } from "@/components/commerce/campaign-provider";

export function CampaignBanner() {
  const status = useCampaign();
  const available = isSaleAvailable(status);

  return (
    <aside
      className={`campaign-banner${available ? "" : " campaign-banner--ended"}`}
      aria-label="عرض Fitkline الحالي"
    >
      <div className="campaign-banner__inner fit-container">
        <span className="campaign-banner__badge">
          {available ? "عرض محدود" : "اكتمل العرض"}
        </span>
        <p>
          <strong>{saleCampaign.title}</strong>
          <span>
            {available
              ? status.remainingCustomers === null
                ? saleCampaign.message
                : `متبقي ${status.remainingCustomers.toLocaleString("ar-EG")} من ${status.customerLimit.toLocaleString("ar-EG")}`
              : "اكتمل عدد العملاء المشمولين بالخصم"}
          </span>
        </p>
        {available ? (
          <Link href="/products">تسوّق العرض <span aria-hidden="true">←</span></Link>
        ) : null}
      </div>
    </aside>
  );
}
