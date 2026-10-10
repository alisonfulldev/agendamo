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
    | "trial_plan"
    | "created_at"
    | "slot_interval_minutes"
    | "min_notice_minutes"
    | "max_days_ahead"
    | "booking_confirmation"
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
  "plan" | "trial_plan" | "trial_started_at" | "trial_ends_at" | "created_at"
>;

/** Plan fields read fresh on every request, so trial/plan changes apply at once (rule 6). */
async function fetchLivePlan(slug: string): Promise<LivePlan | null> {
  const { data, error } = await createAdminClient()
    .from("businesses")
    .select("plan, trial_plan, trial_started_at, trial_ends_at, created_at")
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
