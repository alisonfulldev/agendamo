import "server-only";

import { dataCache, publicPageTag } from "@/lib/cache";
import type { Business, DepositType } from "@/lib/db/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAnonClient } from "@/lib/supabase/anon";

export interface PublicService {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_minutes: number;
  price_cents: number;
  deposit_type: DepositType;
  deposit_value: number;
}

export interface PublicPage {
  business: Pick<
    Business,
    | "id"
    | "name"
    | "slug"
    | "brand_key"
    | "segment"
    | "timezone"
    | "plan"
    | "trial_started_at"
    | "trial_ends_at"
    | "created_at"
    | "slot_interval_minutes"
    | "min_notice_minutes"
    | "max_days_ahead"
    | "booking_confirmation"
    | "portal_opt_out"
  >;
  page: {
    bio: string | null;
    avatar_key: string | null;
    cover_key: string | null;
    primary_color_override: string | null;
    whatsapp_number: string | null;
    instagram_url: string | null;
    address: string | null;
    city: string | null;
    neighborhood: string | null;
    show_prices: boolean;
    has_pix: boolean;
  } | null;
  links: { id: string; label: string; url: string }[];
  services: PublicService[];
  combos: { id: string; name: string; price_cents: number; service_ids: string[] }[];
  professionals: { id: string; name: string; photo_key: string | null }[];
  photos: { id: string; key: string; width: number; height: number }[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    reply: string | null;
    created_at: string;
    first_name: string;
  }[];
  rating: { average: number | null; count: number };
}

async function fetchPublicPage(slug: string): Promise<PublicPage | null> {
  const { data, error } = await createAnonClient().rpc("get_public_page", { p_slug: slug });
  if (error) throw new Error(`get_public_page failed: ${error.message}`);
  return (data as PublicPage | null) ?? null;
}

type LivePlan = Pick<
  Business,
  "plan" | "trial_started_at" | "trial_ends_at" | "created_at" | "portal_opt_out"
>;

/**
 * Fields read fresh on every request: plan and trial, so changes apply at once (rule 6), and the
 * owner's "Não aparecer nas buscas" choice, so the profile leaves the index right away.
 */
async function fetchLivePlan(slug: string): Promise<LivePlan | null> {
  const { data, error } = await createAdminClient()
    .from("businesses")
    .select("plan, trial_started_at, trial_ends_at, created_at, portal_opt_out")
    .eq("slug", slug.toLowerCase())
    .is("suspended_at", null)
    .maybeSingle();
  if (error) throw new Error(`live plan failed: ${error.message}`);
  return (data as LivePlan | null) ?? null;
}

/**
 * Public page data. Content is cached per domain brand + slug (rule 14) and expired by any edit
 * through the slug tag; plan and trial come from an uncached call.
 */
export async function getPublicPage(
  domainBrandKey: string,
  slug: string,
): Promise<PublicPage | null> {
  const [page, live] = await Promise.all([
    dataCache(() => fetchPublicPage(slug), ["public-page", domainBrandKey, slug], {
      tags: [publicPageTag(slug)],
      revalidate: 3600,
    })(),
    fetchLivePlan(slug),
  ]);
  if (!page || !live) return null;
  return {
    ...page,
    business: { ...page.business, ...live },
  };
}

/**
 * Niche (brand key) of a suspended business, so its old links lead somewhere useful (the niche
 * page) instead of a dead end. Null when the link never existed or the account was deleted.
 */
export async function suspendedBusinessBrand(slug: string): Promise<string | null> {
  const { data, error } = await createAdminClient()
    .from("businesses")
    .select("brand_key")
    .eq("slug", slug.toLowerCase())
    .not("suspended_at", "is", null)
    .maybeSingle();
  if (error) {
    console.error("suspended lookup failed", error.message);
    return null;
  }
  return (data as { brand_key: string } | null)?.brand_key ?? null;
}
