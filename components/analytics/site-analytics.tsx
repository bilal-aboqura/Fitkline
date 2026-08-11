"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const VISITOR_KEY = "fitkline_visitor_id";
const SESSION_KEY = "fitkline_session_id";
const ATTRIBUTION_KEY = "fitkline_session_attribution";
const LAST_VIEW_KEY = "fitkline_last_page_view";

type Attribution = {
  referrer: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
};

function createUuid() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

function getOrCreateId(storage: Storage, key: string) {
  const stored = storage.getItem(key);
  if (stored) return stored;
  const id = createUuid();
  storage.setItem(key, id);
  return id;
}

function getAttribution(): Attribution {
  const stored = sessionStorage.getItem(ATTRIBUTION_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as Attribution;
    } catch {
      sessionStorage.removeItem(ATTRIBUTION_KEY);
    }
  }

  const query = new URLSearchParams(window.location.search);
  const attribution = {
    referrer: document.referrer,
    utmSource: query.get("utm_source"),
    utmMedium: query.get("utm_medium"),
    utmCampaign: query.get("utm_campaign"),
  };
  sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  return attribution;
}

export function SiteAnalytics() {
  const pathname = usePathname();
  const memoryIds = useRef<{ visitorId: string; sessionId: string } | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || navigator.doNotTrack === "1") {
      return;
    }

    try {
      const lastView = sessionStorage.getItem(LAST_VIEW_KEY);
      const [lastPath, lastTimestamp] = lastView?.split("|") ?? [];
      if (lastPath === pathname && Date.now() - Number(lastTimestamp) < 5000) return;

      const ids = memoryIds.current ?? {
        visitorId: getOrCreateId(localStorage, VISITOR_KEY),
        sessionId: getOrCreateId(sessionStorage, SESSION_KEY),
      };
      memoryIds.current = ids;
      const attribution = getAttribution();
      sessionStorage.setItem(LAST_VIEW_KEY, `${pathname}|${Date.now()}`);

      void fetch("/api/analytics/page-view", {
        method: "POST",
        headers: { "content-type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          ...ids,
          path: pathname,
          ...attribution,
        }),
      });
    } catch {
      // Storage can be unavailable in strict privacy modes; analytics must never
      // interrupt the shopping experience.
    }
  }, [pathname]);

  return null;
}
