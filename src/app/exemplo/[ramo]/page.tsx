import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NICHES, PLATFORM, type BrandConfig } from "@/brands";
import { nicheHubUrl } from "@/brands/urls";
import { BrandScope } from "@/components/brand-scope";
import { BusinessSite } from "@/components/business-site/business-site";
import {
  EXAMPLE_CITY,
  EXAMPLE_COPY,
  EXAMPLE_NAMES,
  EXAMPLE_REVIEWS,
  SHOWCASE_SLUGS,
} from "@/content/site-examples";
import { getCurrentBrand } from "@/brands/server";
import type { SiteTemplate } from "@/lib/db/types";
import { getPublicPage, type PublicPage } from "@/lib/public/page";
import { getSiteSettings } from "@/lib/public/site";

export const metadata: Metadata = { title: "Site de exemplo", robots: { index: false } };

/** A fictional business of the niche, in the shape of a public page (nothing is stored). */
function examplePage(niche: BrandConfig): PublicPage {
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
    photos: [],
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

/**
 * Example site of a niche for WhatsApp sales (2026-11-06): both templates (?modelo=elegante) and
 * a booking button that opens the booking simulation (nothing is booked). A niche with a showcase
 * business shows that one instead. Out of search engines.
 */
export default async function ExampleSitePage({
  params,
  searchParams,
}: PageProps<"/exemplo/[ramo]">) {
  const { ramo } = await params;
  const { modelo } = await searchParams;
  const niche = NICHES.find((b) => b.niche!.route === ramo);
  if (!niche) notFound();
  const template: SiteTemplate = modelo === "elegante" ? "elegant" : "vibrant";
  const other: SiteTemplate = template === "elegant" ? "vibrant" : "elegant";
  const domainBrand = await getCurrentBrand();

  const showcase = SHOWCASE_SLUGS[niche.key];
  const real = showcase ? await getPublicPage(niche.key, showcase) : null;
  const data = real ?? examplePage(niche);
  const settings = real ? await getSiteSettings(real.business.slug, real.business.id) : null;
  const chatHref = real
    ? `/${real.business.slug}`
    : `/?criar=1&ramo=${encodeURIComponent(ramo)}&nome=${encodeURIComponent(data.business.name)}`;

  return (
    <BrandScope brand={niche} current={domainBrand}>
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-foreground px-4 py-2 text-center text-sm text-background">
        <span className="font-semibold">
          {EXAMPLE_COPY.banner} · {EXAMPLE_COPY.templateName[template]}
        </span>
        <Link
          href={`/exemplo/${ramo}${other === "elegant" ? "?modelo=elegante" : ""}`}
          className="underline underline-offset-4"
        >
          {EXAMPLE_COPY.switchTo[other]}
        </Link>
      </div>
      <BusinessSite
        template={template}
        data={data}
        brand={niche}
        settings={settings}
        chatHref={chatHref}
        badgeHref={nicheHubUrl(niche)}
        logo={PLATFORM.logo}
      />
    </BrandScope>
  );
}
