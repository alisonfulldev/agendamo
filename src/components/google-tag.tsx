"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";

import {
  GOOGLE_ADS_ID,
  GOOGLE_TAG_ID,
  isSitePath,
  META_PIXEL_ID,
  SIGNUP_CONVERSION,
} from "@/lib/analytics/site-paths";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: Fbq;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: Fbq;
    _fbq?: Fbq;
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
    // Only the sign-up conversion: no remarketing lists or ad personalization from the site.
    window.gtag("config", GOOGLE_ADS_ID, { allow_ad_personalization_signals: false });
  }
  window.gtag(...args);
}

/** The standard Meta pixel queue (as in Meta's snippet): calls wait until fbevents.js loads. */
function fbq(...args: unknown[]) {
  if (!window.fbq) {
    const queued = function (...call: unknown[]) {
      if (queued.callMethod) queued.callMethod(...call);
      else queued.queue.push(call);
    } as Fbq;
    queued.queue = [];
    queued.push = queued;
    queued.loaded = true;
    queued.version = "2.0";
    window.fbq = queued;
    window._fbq = window._fbq ?? queued;
    // No automatic events or form reading: only the page views and the sign-up below.
    queued("set", "autoConfig", false, META_PIXEL_ID);
    queued("init", META_PIXEL_ID);
  }
  window.fbq(...args);
}

/**
 * An account was just created in the creation conversation: one sign-up for Analytics, one
 * "Cadastro MeetChat" conversion for Google Ads and one CompleteRegistration for Meta. Nothing
 * about the person is sent. Only where the tags already run (the sales site); elsewhere nothing.
 */
export function trackSignup() {
  if (window.gtag) {
    window.gtag("event", "sign_up", { method: "creation_chat" });
    window.gtag("event", "conversion", { send_to: SIGNUP_CONVERSION });
  }
  window.fbq?.("track", "CompleteRegistration");
}

/**
 * Google tag (gtag.js) and Meta pixel on the sales site only (src/lib/analytics/site-paths.ts).
 * Loaded the first time a site page opens; a page view goes out on each navigation to a site page,
 * so moving into a business link or the panel in the same tab is never measured.
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
    fbq("track", "PageView");
  }, [onSite, pathname]);

  // next/script loads each script once per page load, even if the tags leave and come back.
  return onSite ? (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`}
        strategy="afterInteractive"
      />
      <Script src="https://connect.facebook.net/en_US/fbevents.js" strategy="afterInteractive" />
    </>
  ) : null;
}
