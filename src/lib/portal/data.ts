import "server-only";

import { dataCache } from "@/lib/cache";
import { createAnonClient } from "@/lib/supabase/anon";

export interface PortalListingItem {
  slug: string;
  name: string;
  avatar_key: string | null;
  city: string;
  neighborhood: string | null;
  bio: string | null;
  min_price_cents: number;
  rating: number | null;
  reviews: number;
  professionals: number;
  featured: boolean;
}

export interface PortalIndexItem {
  city_slug: string;
  city: string;
  service_slug: string;
  service_name: string;
  businesses: number;
}

/** Minimum complete businesses for a listing page to be indexed (rule 12). */
export const MIN_INDEXABLE_LISTING = 3;

// Portal data is cached briefly; keys always include the brand (rule 14).

export function getPortalIndex(brandKey: string): Promise<PortalIndexItem[]> {
  return dataCache(
    async () => {
      const { data, error } = await createAnonClient().rpc("portal_index", {
        p_brand_key: brandKey,
      });
      if (error) throw new Error(error.message);
      return (data ?? []) as PortalIndexItem[];
    },
    ["portal-index", brandKey],
    { revalidate: 600 },
  )();
}

export function getPortalListing(
  brandKey: string,
  citySlug: string,
  serviceSlug: string,
  neighborhoodSlug: string | null,
): Promise<PortalListingItem[]> {
  return dataCache(
    async () => {
      const { data, error } = await createAnonClient().rpc("portal_listing", {
        p_brand_key: brandKey,
        p_city_slug: citySlug,
        p_service_slug: serviceSlug,
        p_neighborhood_slug: neighborhoodSlug,
      });
      if (error) throw new Error(error.message);
      return (data ?? []) as PortalListingItem[];
    },
    ["portal-listing", brandKey, citySlug, serviceSlug, neighborhoodSlug ?? ""],
    { revalidate: 300 },
  )();
}

export function getPortalRecentReviews(brandKey: string, citySlug: string, serviceSlug: string) {
  return dataCache(
    async () => {
      const { data } = await createAnonClient().rpc("portal_recent_reviews", {
        p_brand_key: brandKey,
        p_city_slug: citySlug,
        p_service_slug: serviceSlug,
      });
      return (data ?? []) as {
        business_name: string;
        rating: number;
        comment: string;
        created_at: string;
      }[];
    },
    ["portal-reviews", brandKey, citySlug, serviceSlug],
    { revalidate: 600 },
  )();
}
