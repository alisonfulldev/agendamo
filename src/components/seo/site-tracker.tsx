"use client";

import { useEffect } from "react";

import type { SiteTemplate } from "@/lib/tracking/site-events";

const SESSION_KEY = "mc_site_session";
const LANDING_KEY = "mc_site_landing";
const ARRIVAL_KEY = "mc_site_arrival";

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

/**
 * How this visit arrived, kept from its first page (in-site navigation loses it): the referring
 * site's domain and whether the address had an ad click id. Only domains, never full URLs.
 */
export interface SiteArrival {
  referrer?: string;
  click?: "google" | "meta";
}

function readArrival(): SiteArrival {
  let referrer: string | undefined;
  try {
    const host = document.referrer ? new URL(document.referrer).host : "";
    referrer = host && host !== window.location.host ? host.slice(0, 200) : undefined;
  } catch {
    referrer = undefined;
  }
  const params = new URLSearchParams(window.location.search);
  const click =
    params.has("gclid") || params.has("gbraid") || params.has("wbraid")
      ? "google"
      : params.has("fbclid")
        ? "meta"
        : undefined;
  return { referrer, click };
}

/** The visit's arrival (first page of this tab's session), or the current page's own. */
export function siteArrival(): SiteArrival {
  try {
    const saved = sessionStorage.getItem(ARRIVAL_KEY);
    if (saved) return JSON.parse(saved) as SiteArrival;
  } catch {
    // Blocked storage: use what this page knows.
  }
  return readArrival();
}

function rememberArrival() {
  try {
    if (!sessionStorage.getItem(ARRIVAL_KEY)) {
      sessionStorage.setItem(ARRIVAL_KEY, JSON.stringify(readArrival()));
    }
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
