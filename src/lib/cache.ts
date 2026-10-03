import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";

import { isDemoMode } from "@/lib/demo/mode";

/**
 * Cache tag of a business's public page. Cached entries are keyed by domain brand key + slug
 * (rule 14); the tag (by slug, which is what the page is fetched by) expires them all at once.
 */
export function publicPageTag(slug: string): string {
  return `public-page:${slug}`;
}

/** Expires the public page right away (works in Server Actions and Route Handlers). */
export function invalidatePublicPage(slug: string): void {
  revalidateTag(publicPageTag(slug), { expire: 0 });
}

/**
 * unstable_cache, except in the local demo mode: there the database can be recreated at any
 * time (reset on /demo), so cached reads would show data that no longer exists.
 */
export const dataCache: typeof unstable_cache = (fn, keyParts, options) =>
  isDemoMode() ? fn : unstable_cache(fn, keyParts, options);
