import { NextRequest, NextResponse } from "next/server";
import { recordPageView } from "@/lib/analytics-store";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BOT_PATTERN =
  /bot|crawler|spider|preview|lighthouse|headless|curl|wget|python|facebookexternalhit|slurp/i;

type Payload = {
  visitorId?: unknown;
  sessionId?: unknown;
  path?: unknown;
  referrer?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
};

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().slice(0, maxLength);
  return cleaned || null;
}

function getReferrerHost(value: unknown, requestHost: string) {
  const referrer = cleanText(value, 500);
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    return host === requestHost.toLowerCase() ? null : host.slice(0, 180);
  } catch {
    return null;
  }
}

function getDeviceCategory(userAgent: string) {
  if (/ipad|tablet|kindle|silk|android(?!.*mobile)/i.test(userAgent)) {
    return "tablet" as const;
  }
  if (/mobile|iphone|ipod|android/i.test(userAgent)) return "mobile" as const;
  return "desktop" as const;
}

export async function POST(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (BOT_PATTERN.test(userAgent)) return new NextResponse(null, { status: 202 });

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) {
    return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const visitorId = cleanText(payload.visitorId, 36);
  const sessionId = cleanText(payload.sessionId, 36);
  const path = cleanText(payload.path, 300);
  if (
    !visitorId ||
    !sessionId ||
    !path ||
    !UUID_PATTERN.test(visitorId) ||
    !UUID_PATTERN.test(sessionId) ||
    !path.startsWith("/") ||
    path.startsWith("/admin") ||
    path.startsWith("/api")
  ) {
    return NextResponse.json({ error: "Invalid analytics event." }, { status: 400 });
  }

  try {
    await recordPageView({
      visitorId,
      sessionId,
      path,
      referrerHost: getReferrerHost(payload.referrer, request.nextUrl.hostname),
      utmSource: cleanText(payload.utmSource, 100),
      utmMedium: cleanText(payload.utmMedium, 100),
      utmCampaign: cleanText(payload.utmCampaign, 140),
      deviceCategory: getDeviceCategory(userAgent),
    });
    return new NextResponse(null, { status: 202 });
  } catch (error) {
    console.error("Unable to store analytics page view.", error);
    return NextResponse.json({ error: "Analytics unavailable." }, { status: 503 });
  }
}
