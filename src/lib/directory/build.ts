/**
 * Niche directory (/{nicho}/{cidade}, D4 2026-10-16): built only from real complete profiles of
 * the niche (same rule as the sitemap). Pure functions; data comes from src/lib/directory/data.ts.
 */
export const DIRECTORY_CONFIG = {
  /** Profiles needed for a city page to be indexable (fewer: noindex, follow; none: 404). */
  minIndexable: 3,
};

export interface DirectoryBusiness {
  slug: string;
  name: string;
  avatarKey: string | null;
  bio: string | null;
  city: string;
  citySlug: string;
  neighborhood: string | null;
  /** Active services, in the owner's order. */
  services: { name: string; priceCents: number }[];
  /** The owner's choice to show prices on the profile. */
  showPrices: boolean;
  /** Last change of the profile (page settings). */
  updatedAt: string;
}

export interface DirectoryCity {
  citySlug: string;
  city: string;
  count: number;
  /** Newest profile change in the city (sitemap lastmod). */
  updatedAt: string;
  indexable: boolean;
}

/** Cities with complete profiles of the niche, most profiles first. */
export function directoryCities(businesses: DirectoryBusiness[]): DirectoryCity[] {
  const byCity = new Map<string, DirectoryBusiness[]>();
  for (const business of businesses) {
    if (!business.citySlug) continue;
    byCity.set(business.citySlug, [...(byCity.get(business.citySlug) ?? []), business]);
  }
  return [...byCity.entries()]
    .map(([citySlug, list]) => ({
      citySlug,
      city: mostCommon(list.map((b) => b.city)),
      count: list.length,
      updatedAt: list
        .map((b) => b.updatedAt)
        .sort()
        .at(-1)!,
      indexable: list.length >= DIRECTORY_CONFIG.minIndexable,
    }))
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, "pt-BR"));
}

/** The city page: its profiles (alphabetical, no paid ranking) or null when there are none. */
export function cityListing(businesses: DirectoryBusiness[], citySlug: string) {
  const list = businesses
    .filter((b) => b.citySlug === citySlug)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  if (list.length === 0) return null;
  const city = directoryCities(list)[0]!;
  return { ...city, businesses: list };
}

/** Lowest and highest priced service, only when the owner shows prices. */
export function priceRange(business: DirectoryBusiness): { min: number; max: number } | null {
  if (!business.showPrices) return null;
  const prices = business.services.map((s) => s.priceCents).filter((p) => p > 0);
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

function mostCommon(values: string[]): string {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]![0];
}
