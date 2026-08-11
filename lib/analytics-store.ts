import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export type AnalyticsDailyPoint = {
  date: string;
  visitors: number;
  pageViews: number;
};

export type AnalyticsSummary = {
  available: boolean;
  periodDays: number;
  generatedAt: string;
  totals: {
    allTimeVisitors: number;
    visitors: number;
    previousVisitors: number;
    pageViews: number;
    previousPageViews: number;
    sessions: number;
    orders: number;
    averagePagesPerSession: number;
    conversionRate: number;
    returningVisitors: number;
    singlePageSessions: number;
  };
  daily: AnalyticsDailyPoint[];
  topPages: Array<{ path: string; views: number; visitors: number }>;
  sources: Array<{ source: string; sessions: number }>;
  devices: Array<{
    device: "desktop" | "mobile" | "tablet";
    visitors: number;
  }>;
};

type PageViewInput = {
  visitorId: string;
  sessionId: string;
  path: string;
  referrerHost: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  deviceCategory: "desktop" | "mobile" | "tablet";
};

function emptySummary(days: number): AnalyticsSummary {
  return {
    available: false,
    periodDays: days,
    generatedAt: new Date().toISOString(),
    totals: {
      allTimeVisitors: 0,
      visitors: 0,
      previousVisitors: 0,
      pageViews: 0,
      previousPageViews: 0,
      sessions: 0,
      orders: 0,
      averagePagesPerSession: 0,
      conversionRate: 0,
      returningVisitors: 0,
      singlePageSessions: 0,
    },
    daily: [],
    topPages: [],
    sources: [],
    devices: [],
  };
}

export async function recordPageView(input: PageViewInput) {
  const { error } = await getSupabaseServerClient()
    .from("fitkline_analytics_events")
    .insert({
      visitor_id: input.visitorId,
      session_id: input.sessionId,
      path: input.path,
      referrer_host: input.referrerHost,
      utm_source: input.utmSource,
      utm_medium: input.utmMedium,
      utm_campaign: input.utmCampaign,
      device_category: input.deviceCategory,
    });
  if (error) throw error;
}

export async function getAnalyticsSummary(days = 30): Promise<AnalyticsSummary> {
  noStore();
  const normalizedDays = [7, 30, 90].includes(days) ? days : 30;
  const fallback = emptySummary(normalizedDays);

  try {
    const { data, error } = await getSupabaseServerClient().rpc(
      "fitkline_get_analytics",
      { p_days: normalizedDays },
    );
    if (error) throw error;
    if (!data || typeof data !== "object" || Array.isArray(data)) return fallback;
    return { ...(data as Omit<AnalyticsSummary, "available">), available: true };
  } catch (error) {
    console.error("Unable to load Fitkline analytics.", error);
    return fallback;
  }
}
