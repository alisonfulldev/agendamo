import * as Sentry from "@sentry/nextjs";

import { needsFullReloadForBrand } from "@/brands/host";
import { browserSentryDsn } from "@/lib/sentry-dsn";

const dsn = browserSentryDsn();

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
});

export function onRouterTransitionStart(
  url: string,
  navigationType: "push" | "replace" | "traverse",
) {
  const target = new URL(url, window.location.href);
  if (needsFullReloadForBrand(target, document.documentElement.dataset.brand)) {
    window.location.assign(target);
    return;
  }
  Sentry.captureRouterTransitionStart(url, navigationType);
}
