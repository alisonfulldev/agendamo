import "server-only";

import { dataCache, publicPageTag } from "@/lib/cache";
import type { SiteSettings } from "@/lib/db/types";
import { getPlanFeatures } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

/** Sections of the business site, in their default order. */
export const SITE_SECTIONS = [
  { key: "about", label: "Sobre" },
  { key: "services", label: "Serviços e preços" },
  { key: "photos", label: "Fotos" },
  { key: "reviews", label: "Avaliações" },
  { key: "how", label: "Como agendar" },
  { key: "location", label: "Localização" },
  { key: "faq", label: "Dúvidas" },
] as const;

export type SiteSectionKey = (typeof SITE_SECTIONS)[number]["key"];

export const SITE_SECTION_KEYS = SITE_SECTIONS.map((s) => s.key) as SiteSectionKey[];

/**
 * Order and visibility of the sections: the owner's choice, with sections added later appended
 * (visible) and unknown keys dropped.
 */
export function resolveSections(
  saved: SiteSettings["sections"],
): { key: SiteSectionKey; visible: boolean }[] {
  const known = new Set<string>(SITE_SECTION_KEYS);
  const fromSaved = (saved ?? [])
    .filter((s) => known.has(s.key))
    .map((s) => ({ key: s.key as SiteSectionKey, visible: s.visible !== false }));
  const seen = new Set(fromSaved.map((s) => s.key));
  return [
    ...fromSaved,
    ...SITE_SECTION_KEYS.filter((k) => !seen.has(k)).map((key) => ({ key, visible: true })),
  ];
}

async function fetchSiteSettings(businessId: string): Promise<SiteSettings | null> {
  const { data, error } = await createAdminClient()
    .from("site_settings")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw new Error(`site settings failed: ${error.message}`);
  return (data as SiteSettings | null) ?? null;
}

/** The owner's site edits, cached with the public page (any edit expires both by the slug tag). */
export function getSiteSettings(slug: string, businessId: string): Promise<SiteSettings | null> {
  return dataCache(() => fetchSiteSettings(businessId), ["site-settings", businessId], {
    tags: [publicPageTag(slug)],
    revalidate: 3600,
  })();
}

async function fetchLiveDomain(businessId: string): Promise<string | null> {
  const { data } = await createAdminClient()
    .from("custom_domains")
    .select("domain")
    .eq("business_id", businessId)
    .eq("status", "live")
    .maybeSingle();
  return (data?.domain as string | undefined) ?? null;
}

/** The own domain serving the site, once live (cached with the public page). */
export function getLiveDomain(slug: string, businessId: string): Promise<string | null> {
  return dataCache(() => fetchLiveDomain(businessId), ["live-domain", businessId], {
    tags: [publicPageTag(slug)],
    revalidate: 3600,
  })();
}

/**
 * Slugs of businesses whose site is live (trial or "Site + Agenda"), out of the given slugs (the
 * complete profiles): the sitemap lists their /<slug>/site. Plan read fresh (rule 6).
 */
export async function liveSiteSlugs(slugs: string[]): Promise<Set<string>> {
  if (!slugs.length) return new Set();
  const { data, error } = await createAdminClient()
    .from("businesses")
    .select("slug, plan, plan_tier, trial_ends_at")
    .in("slug", slugs)
    .is("suspended_at", null);
  if (error) throw new Error(`live sites failed: ${error.message}`);
  // A site on its own domain is not listed here (its MeetChat address redirects there).
  const { data: domains } = await createAdminClient()
    .from("custom_domains")
    .select("business:businesses(slug)")
    .eq("status", "live");
  const ownDomain = new Set(
    (domains ?? []).map((d) => (d.business as unknown as { slug: string } | null)?.slug),
  );
  return new Set(
    (data ?? [])
      .filter(
        (b) =>
          getPlanFeatures({
            plan: b.plan as "free" | "complete",
            trial_ends_at: b.trial_ends_at as string | null,
            plan_tier: b.plan_tier as "complete" | "site",
          }).site,
      )
      .map((b) => b.slug as string)
      .filter((slug) => !ownDomain.has(slug)),
  );
}
