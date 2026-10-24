"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";

import { GOOGLE_TAG_ID, isSitePath } from "@/lib/analytics/site-paths";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** The standard gtag queue: commands wait in dataLayer until gtag.js loads. */
function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer ?? [];
  if (!window.gtag) {
    window.gtag = function () {
      // gtag.js reads the `arguments` object itself, as in Google's snippet.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", GOOGLE_TAG_ID, { send_page_view: false });
  }
  window.gtag(...args);
}

/**
 * Google tag (gtag.js) on the sales site only (src/lib/analytics/site-paths.ts). Loaded the first
 * time a site page opens; a page view goes out on each navigation to a site page, so moving into a
 * business link or the panel in the same tab is never measured.
 */
export function GoogleTag({ nicheRoutes }: { nicheRoutes: readonly string[] }) {
  const pathname = usePathname();
  const onSite = isSitePath(pathname, nicheRoutes);
  useEffect(() => {
    if (!onSite) return;
    gtag("event", "page_view", {
      page_location: window.location.origin + pathname,
      page_title: document.title,
    });
  }, [onSite, pathname]);

  // next/script loads gtag.js once per page load, even if the tag leaves and comes back.
  return onSite ? (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`}
      strategy="afterInteractive"
    />
  ) : null;
}
