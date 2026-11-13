import { NICHE_SEO } from "./niche-seo";

/**
 * Institutional pages of the MeetChat site and the date their text last changed (YYYY-MM-DD).
 * The sitemap's <lastmod> and the "Atualizado em" of each page read it from here: update the date
 * whenever the page's content changes (never the deploy date).
 */
export const SITE_PAGES = {
  home: { path: "/", updatedAt: "2026-11-13" },
  pricing: { path: "/precos", updatedAt: "2026-11-13" },
  about: { path: "/sobre", updatedAt: "2026-11-13" },
  terms: { path: "/termos", updatedAt: "2026-10-12" },
  privacy: { path: "/privacidade", updatedAt: "2026-11-13" },
} as const;

/**
 * Last change of the niche pages' shared template and texts (src/content/niche-seo.ts,
 * niche-pages.ts, home.ts). A niche's own `updatedAt` in niche-seo.ts wins when it is newer.
 */
export const NICHE_PAGES_UPDATED_AT = "2026-11-13";

/** A niche page's last change: the shared template's date or its own, whichever is newer. */
export function nichePageUpdatedAt(brandKey: string): string {
  const own = NICHE_SEO[brandKey]?.updatedAt;
  return own && own > NICHE_PAGES_UPDATED_AT ? own : NICHE_PAGES_UPDATED_AT;
}

/** "2026-10-12" → "12/10/2026". */
export function formatPageDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}
