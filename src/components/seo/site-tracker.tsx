"use client";

import { useEffect } from "react";

import type { SiteTemplate } from "@/lib/tracking/site-events";

const SESSION_KEY = "mc_site_session";
const LANDING_KEY = "mc_site_landing";

/** Template and niche of the page on screen, for the CTA click and the sign-up source. */
let current: { template: SiteTemplate; niche: string | null } = { template: "outro", niche: null };

function stored(key: string, create: () => string): string | null {
  try {
    const value = sessionStorage.getItem(key);
    if (value) return value;
    const fresh = create();
    sessionStorage.setItem(key, fresh);
    return fresh;
  } catch {
    // Private mode or blocked storage: no tracking.
    return null;
  }
}

/** First page of this tab's session (attribution), or null. */
export function siteLanding(): string | null {
  try {
    return sessionStorage.getItem(LANDING_KEY);
  } catch {
    return null;
  }
}

/** Template and niche of the page on screen. */
export function siteContext() {
  return current;
}

/** Sends an anonymous funnel event (beacon, never blocks the page). */
export function trackSiteEvent(type: "page_view" | "cta_click") {
  if (typeof window === "undefined" || navigator.webdriver) return;
  const path = window.location.pathname.slice(0, 200);
  const sessionId = stored(SESSION_KEY, () => crypto.randomUUID());
  if (!sessionId) return;
  const landing = stored(LANDING_KEY, () => path);
  const body = JSON.stringify({ type, path, ...current, landing, sessionId });
  try {
    const sent = navigator.sendBeacon?.(
      "/api/site-events",
      new Blob([body], { type: "application/json" }),
    );
    if (!sent) {
      void fetch("/api/site-events", { method: "POST", body, keepalive: true }).catch(() => {});
    }
  } catch {
    // Never break the page for analytics.
  }
}

/** Records the page view of a marketing page (once per page load). */
export function SiteTracker({
  template,
  niche = null,
}: {
  template: SiteTemplate;
  niche?: string | null;
}) {
  useEffect(() => {
    current = { template, niche };
    trackSiteEvent("page_view");
  }, [template, niche]);
  return null;
}
