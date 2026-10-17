import type { PublicPage } from "./page";

/**
 * Minimum content of an indexable business profile (rule 12). Same numbers as the database's
 * complete_businesses (sitemap, portal), so the page and the sitemap always agree.
 */
export const PROFILE_INDEX_RULES = {
  minBioLength: 30,
  minPricedServices: 3,
};

type ProfileData = Pick<PublicPage, "page" | "services"> & {
  business: Pick<PublicPage["business"], "portal_opt_out">;
};

/** Complete profile: photo, description, city and enough services with price (texts are saved trimmed). */
export function isCompleteProfile(data: Pick<PublicPage, "page" | "services">): boolean {
  return (
    Boolean(data.page?.avatar_key) &&
    (data.page?.bio?.length ?? 0) >= PROFILE_INDEX_RULES.minBioLength &&
    Boolean(data.page?.city) &&
    data.services.filter((s) => s.price_cents > 0).length >= PROFILE_INDEX_RULES.minPricedServices
  );
}

/**
 * Whether search engines may index the profile (index, follow + sitemap): complete, and the owner
 * did not turn on "Não aparecer nas buscas". Otherwise noindex, follow.
 */
export function isIndexable(data: ProfileData): boolean {
  return !data.business.portal_opt_out && isCompleteProfile(data);
}
