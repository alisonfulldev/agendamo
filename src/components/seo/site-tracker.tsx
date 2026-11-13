"use client";

import { useEffect } from "react";

import { arrivalFrom, keepArrival, parseArrival, type Arrival } from "@/lib/analytics/arrival";
import type { SiteTemplate } from "@/lib/tracking/site-events";

const SESSION_KEY = "mc_site_session";
const LANDING_KEY = "mc_site_landing";
// localStorage since 2026-11-13 (was sessionStorage "mc_site_arrival", lost in a new tab).
const ARRIVAL_KEY = "mc_first_touch";

/** Template and niche of the page on screen, for the CTA click and the sign-up source. */
let current: { template: SiteTemplate; niche: string | null; experiment: string | null } = {
  template: "outro",
  niche: null,
  experiment: null,
};

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

function currentArrival(): Arrival {
  return arrivalFrom({
    search: window.location.search,
    referrer: document.referrer,
    host: window.location.host,
    path: window.location.pathname,
    now: Date.now(),
  });
}

/**
 * How the visitor first arrived (src/lib/analytics/arrival.ts): kept for 30 days in this browser,
 * so in-site navigation, the ?criar=1 button and the confirmation e-mail's new tab keep it.
 * Falls back to what the current page knows when storage is blocked.
 */
export function siteArrival(): Arrival {
  try {
    const saved = parseArrival(localStorage.getItem(ARRIVAL_KEY), Date.now());
    if (saved) return saved;
  } catch {
    // Blocked storage: use what this page knows.
  }
  return currentArrival();
}

/** Saves the first touch (or replaces a direct or expired one). Called on every site page. */
export function rememberArrival() {
  try {
    const now = Date.now();
    const saved = parseArrival(localStorage.getItem(ARRIVAL_KEY), now);
    const kept = keepArrival(saved, currentArrival());
    if (kept !== saved) localStorage.setItem(ARRIVAL_KEY, JSON.stringify(kept));
  } catch {
    // Private mode: no attribution.
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
  experiment = null,
}: {
  template: SiteTemplate;
  niche?: string | null;
  /** "experiment:variant" shown on this page (docs/design/experiments.md). */
  experiment?: string | null;
}) {
  useEffect(() => {
    current = { template, niche, experiment };
    rememberArrival();
    trackSiteEvent("page_view");
  }, [template, niche, experiment]);
  return null;
}
