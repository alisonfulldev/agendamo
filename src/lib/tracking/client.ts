"use client";

import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, type PageEventType } from "./events";

/** Anonymous session id in a first-party cookie; renewed on each event (30 min of inactivity). */
export function getSessionId(): string {
  const match = document.cookie.match(new RegExp(`(?:^|; )${SESSION_COOKIE}=([0-9a-f-]{36})`));
  const id = match?.[1] ?? crypto.randomUUID();
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SESSION_COOKIE}=${id}; Max-Age=${SESSION_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  return id;
}

/** Fire-and-forget event (sendBeacon survives navigation to WhatsApp/Instagram). No personal data. */
export function track(
  businessId: string,
  type: PageEventType,
  meta: Record<string, string> = {},
): void {
  try {
    const body = JSON.stringify({ businessId, type, sessionId: getSessionId(), meta });
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/events", blob)) {
      void fetch("/api/events", {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      });
    }
  } catch {
    // Tracking must never break the page.
  }
}
