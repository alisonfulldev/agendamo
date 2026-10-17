import "server-only";

import { dataCache } from "@/lib/cache";
import { createAdminClient } from "@/lib/supabase/admin";

import { cityListing, directoryCities, type DirectoryBusiness } from "./build";

interface CompleteRow {
  id: string;
  slug: string;
  name: string;
  avatar_key: string | null;
  bio: string | null;
  city: string | null;
  city_slug: string | null;
  neighborhood: string | null;
  updated_at: string;
}

/**
 * Complete profiles of a niche (database's complete_businesses: photo, bio, city, 3+ priced
 * services, not suspended, not opted out of search) with their active services and the owner's
 * "show prices" choice. Cached 10 minutes per niche (rule 14: the key carries the brand).
 */
export function directoryBusinesses(brandKey: string): Promise<DirectoryBusiness[]> {
  return dataCache(
    async () => {
      const admin = createAdminClient();
      const { data, error } = await admin.rpc("complete_businesses", { p_brand_key: brandKey });
      if (error) {
        console.error("complete_businesses failed", error.message);
        return [];
      }
      const rows = (data ?? []) as CompleteRow[];
      if (rows.length === 0) return [];
      const ids = rows.map((r) => r.id);
      const [services, settings] = await Promise.all([
        admin
          .from("services")
          .select("business_id, name, price_cents")
          .in("business_id", ids)
          .eq("active", true)
          .order("position"),
        admin.from("page_settings").select("business_id, show_prices").in("business_id", ids),
      ]);
      if (services.error || settings.error) {
        console.error("directory details failed", services.error?.message, settings.error?.message);
        return [];
      }
      const showPrices = new Map(
        (settings.data ?? []).map((s) => [s.business_id as string, s.show_prices as boolean]),
      );
      return rows.map((row) => ({
        slug: row.slug,
        name: row.name,
        avatarKey: row.avatar_key,
        bio: row.bio,
        city: row.city ?? "",
        citySlug: row.city_slug ?? "",
        neighborhood: row.neighborhood,
        services: (services.data ?? [])
          .filter((s) => s.business_id === row.id)
          .map((s) => ({ name: s.name as string, priceCents: s.price_cents as number })),
        showPrices: showPrices.get(row.id) ?? true,
        updatedAt: row.updated_at,
      }));
    },
    ["directory", brandKey],
    { revalidate: 600 },
  )();
}

/** Cities of a niche's directory. */
export async function getDirectoryCities(brandKey: string) {
  return directoryCities(await directoryBusinesses(brandKey));
}

/** One city page of a niche's directory, or null (no complete profile there). */
export async function getCityListing(brandKey: string, citySlug: string) {
  return cityListing(await directoryBusinesses(brandKey), citySlug);
}
