"use client";

import { isSaleAvailable, saleCampaign } from "@/data/campaign";
import { useCampaign } from "@/components/commerce/campaign-provider";

export function CampaignBadge() {
  const status = useCampaign();
  if (!isSaleAvailable(status)) return null;

  return (
    <span className="campaign-sale-badge">
      خصم حتى {saleCampaign.electronicDiscountPercent}%
    </span>
  );
}
