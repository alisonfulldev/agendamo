import "server-only";

import type { CatalogItem } from "@/lib/db/types";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Services of a site or products of a store ("Site ou Loja", 2026-11-07). Read with the service
 * role: the public site shows the active ones, the panel all of them (owner checked by the page).
 */
export const CATALOG_LIMIT = 300;

export async function loadCatalog(
  businessId: string,
  options: { onlyActive?: boolean } = {},
): Promise<CatalogItem[]> {
  let query = createAdminClient()
    .from("catalog_items")
    .select("*")
    .eq("business_id", businessId)
    .order("position")
    .order("created_at")
    .limit(CATALOG_LIMIT);
  if (options.onlyActive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) {
    console.error("catalog load failed", { business: businessId, code: error.code });
    return [];
  }
  return (data ?? []) as CatalogItem[];
}

/** "service" on a site, "product" in a store. */
export function catalogKind(product: string | null | undefined): CatalogItem["kind"] {
  return product === "store" ? "product" : "service";
}
