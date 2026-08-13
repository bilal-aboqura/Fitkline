"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SaleCampaignStatus } from "@/data/campaign";

const CampaignContext = createContext<SaleCampaignStatus | null>(null);

export function CampaignProvider({
  status,
  children,
}: {
  status: SaleCampaignStatus;
  children: ReactNode;
}) {
  return (
    <CampaignContext.Provider value={status}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const status = useContext(CampaignContext);
  if (!status) {
    throw new Error("useCampaign must be used inside CampaignProvider");
  }
  return status;
}
