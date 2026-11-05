import type { BrandConfig } from "@/brands";
import {
  EXAMPLE_CITY,
  EXAMPLE_COPY,
  EXAMPLE_GALLERY,
  EXAMPLE_NAMES,
  EXAMPLE_REVIEWS,
} from "@/content/site-examples";

import type { PublicPage } from "./page";

/** A fictional business of the niche, in the shape of a public page (nothing is stored). */
export function examplePage(niche: BrandConfig): PublicPage {
  const name = EXAMPLE_NAMES[niche.key] ?? "Seu negócio";
  const now = new Date().toISOString();
  const services = niche.suggestedServices.slice(0, 6).map((s, i) => ({
    id: `example-${i}`,
    name: s.name,
    description: null,
    duration_minutes: s.durationMinutes,
    buffer_minutes: 0,
    // A believable price from the duration (R$ 5 steps).
    price_cents: Math.max(40, Math.round((s.durationMinutes * 1.6) / 5) * 5) * 100,
    deposit_type: "none" as const,
    deposit_value: 0,
  }));
  return {
    business: {
      id: "00000000-0000-0000-0000-000000000000",
      name,
      slug: "exemplo",
      brand_key: niche.key,
      segment: niche.defaultSegment,
      timezone: "America/Sao_Paulo",
      plan: "complete",
      plan_tier: "site",
      trial_started_at: null,
      trial_ends_at: null,
      created_at: now,
      slot_interval_minutes: 30,
      min_notice_minutes: 60,
      max_days_ahead: 60,
      booking_confirmation: "auto",
      portal_opt_out: true,
    },
    page: {
      bio: EXAMPLE_COPY.bio(niche.niche?.name ?? "atendimento", name),
      avatar_key: null,
      cover_key: null,
      primary_color_override: null,
      whatsapp_number: null,
      instagram_url: null,
      address: "Rua das Flores, 123",
      city: EXAMPLE_CITY,
      neighborhood: "Centro",
      show_prices: true,
      has_pix: false,
    },
    links: [],
    services,
    combos: [],
    professionals: [],
    // Paths of the public folder (not R2 keys): the site views use them as they are.
    photos: Array.from({ length: EXAMPLE_GALLERY[niche.key] ?? 0 }, (_, i) => ({
      id: `photo-${i}`,
      key: `/examples/gallery/${niche.key}-${i + 1}.webp`,
      width: 700,
      height: 700,
    })),
    reviews: EXAMPLE_REVIEWS.map((r, i) => ({
      id: `review-${i}`,
      rating: r.rating,
      comment: r.comment,
      reply: null,
      created_at: now,
      first_name: r.first_name,
    })),
    rating: { average: 5, count: 48 },
  };
}
