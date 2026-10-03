import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Business profiles of a brand that meet the minimum content to be indexed (rule 12):
 * photo, description and at least 3 services with price. Others are noindex and out of the sitemap.
 */
export async function indexableBusinessSlugs(
  brandKey: string,
): Promise<{ slug: string; updatedAt: string }[]> {
  const { data, error } = await createAdminClient().rpc("indexable_businesses", {
    p_brand_key: brandKey,
  });
  if (error) {
    console.error("indexable_businesses failed", error.message);
    return [];
  }
  return (data ?? []).map((row: { slug: string; updated_at: string }) => ({
    slug: row.slug,
    updatedAt: row.updated_at,
  }));
}

/** Portal listing pages with enough complete businesses (Prompt 36). */
export async function indexablePortalPaths(brandKey: string): Promise<string[]> {
  const { data, error } = await createAdminClient().rpc("indexable_portal_pages", {
    p_brand_key: brandKey,
  });
  if (error) {
    console.error("indexable_portal_pages failed", error.message);
    return [];
  }
  return (data ?? []).map((row: { path: string }) => row.path);
}
