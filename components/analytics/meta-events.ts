"use client";

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
  }
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
