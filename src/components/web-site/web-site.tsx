import type { CSSProperties, ReactNode } from "react";

import { CUSTOM_WEB_SITES } from "./custom";
import { FloatingWhatsApp } from "./parts";
import { SiteBold, SiteClean } from "./site-templates";
import { StoreClean, StoreShowcase } from "./store-templates";
import type { WebSiteData } from "./types";

/**
 * The public site of a "Site ou Loja" business (2026-11-07), in its template and colors. Two
 * templates for sites and two for stores; every button goes to the owner's WhatsApp.
 */
export function WebSite({
  data,
  theme,
  badge,
}: {
  data: WebSiteData;
  /** Brand theme with the owner's colors (siteTheme). */
  theme: CSSProperties;
  badge: ReactNode;
}) {
  // A site made by a person for this business (custom site), else the owner's template.
  const Template =
    CUSTOM_WEB_SITES[data.businessId] ??
    (data.template === "site_clean"
      ? SiteClean
      : data.template === "store_showcase"
        ? StoreShowcase
        : data.template === "store_clean"
          ? StoreClean
          : SiteBold);
  return (
    <div data-theme-scope="" style={theme} className="min-h-[100dvh] bg-background">
      <Template data={data} badge={badge} />
      {/* On a store the bag bar takes that spot; the WhatsApp is in the header and the end. */}
      {data.store ? null : <FloatingWhatsApp href={data.whatsappHref} />}
    </div>
  );
}

/** Waiting mode (no subscription): only the name and the WhatsApp, no site. */
export function WebSiteWaiting({
  name,
  whatsappHref,
  theme,
  badge,
}: {
  name: string;
  whatsappHref: string | null;
  theme: CSSProperties;
  badge: ReactNode;
}) {
  return (
    <div
      data-theme-scope=""
      style={theme}
      className="lp-brand flex min-h-[100dvh] flex-col items-center justify-center gap-8 px-6 text-center"
    >
      <h1 className="lp-title text-5xl text-balance sm:text-7xl">{name}</h1>
      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          data-track="click_whatsapp"
          className="inline-flex min-h-16 items-center rounded-full bg-[var(--lp-cta-bg)] px-9 text-xl font-semibold text-[var(--lp-cta-fg)] shadow-lg"
        >
          Falar no WhatsApp
        </a>
      ) : null}
      <div className="text-sm opacity-80">{badge}</div>
    </div>
  );
}
