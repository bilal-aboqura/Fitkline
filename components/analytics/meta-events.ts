"use client";

import { META_PIXEL_ID } from "@/components/analytics/meta-config";

type MetaEventOptions = {
  eventId?: string;
};

type QueuedMetaEvent = {
  name: string;
  parameters: Record<string, unknown>;
  options?: MetaEventOptions;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    fitklineMetaQueue?: QueuedMetaEvent[];
    fitklineMetaUserData?: Record<string, string>;
  }
}

/**
 * Enables Meta's manual advanced matching for a shopper who has deliberately
 * submitted checkout details. Meta hashes the identifiers in the browser.
 */
export function setMetaAdvancedMatching({
  email,
  phone,
}: {
  email: unknown;
  phone: unknown;
}) {
  if (typeof window === "undefined") return;

  const em = typeof email === "string" ? email.trim().toLowerCase() : "";
  const ph = typeof phone === "string" ? phone.trim() : "";
  const userData = {
    ...(em ? { em } : {}),
    ...(ph ? { ph } : {}),
  };

  if (!Object.keys(userData).length) return;

  window.fitklineMetaUserData = userData;
  window.fbq?.("init", META_PIXEL_ID, userData);
}

export function trackMetaEvent(
  name: string,
  parameters: Record<string, unknown> = {},
  options?: MetaEventOptions,
) {
  if (typeof window === "undefined") return;

  if (window.fbq) {
    window.fbq("track", name, parameters, options?.eventId
      ? { eventID: options.eventId }
      : undefined);
    return;
  }

  window.fitklineMetaQueue ??= [];
  window.fitklineMetaQueue.push({ name, parameters, options });
}

export function flushMetaEventQueue() {
  if (!window.fbq || !window.fitklineMetaQueue?.length) return;
  const events = window.fitklineMetaQueue.splice(0);
  events.forEach(({ name, parameters, options }) => {
    window.fbq?.("track", name, parameters, options?.eventId
      ? { eventID: options.eventId }
      : undefined);
  });
}
