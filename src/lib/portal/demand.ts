import "server-only";

import type { Business } from "@/lib/db/types";
import { slugify } from "@/lib/slug";
import { MIN_DISPLAY_COUNT, displayCount } from "@/lib/stats";
import { createAdminClient } from "@/lib/supabase/admin";

export interface Radar {
  city: string | null;
  month: string;
  /** Searches per service of the business in its city (only values ≥ 5 are kept). */
  searches: { service: string; count: number }[];
  appearances: number;
  clicks: number;
  /** Top hours (São Paulo time) with the most searches. */
  peakHours: number[];
  /** Most searched services in the city (≥ 5). */
  nearby: { service: string; count: number }[];
  featured: boolean;
}

function monthStart(date = new Date()): string {
  return `${date.toISOString().slice(0, 7)}-01`;
}

/** Demand around the business this month. Numbers below 5 are dropped (rule 5). */
export async function getRadar(business: Pick<Business, "id" | "brand_key">): Promise<Radar> {
  const admin = createAdminClient();
  const month = monthStart();
  const [{ data: page }, { data: services }] = await Promise.all([
    admin.from("page_settings").select("city").eq("business_id", business.id).maybeSingle(),
    admin.from("services").select("name").eq("business_id", business.id).eq("active", true),
  ]);
  const city = (page?.city as string | null) ?? null;
  const empty: Radar = {
    city,
    month,
    searches: [],
    appearances: 0,
    clicks: 0,
    peakHours: [],
    nearby: [],
    featured: false,
  };
  if (!city) return empty;
  const citySlug = slugify(city);
  const serviceNames = new Map(
    (services ?? []).map((s) => [slugify(s.name as string), s.name as string]),
  );

  const [stats, own, hourly, featured] = await Promise.all([
    admin
      .from("portal_stats_monthly")
      .select("service_slug, views")
      .eq("brand_key", business.brand_key)
      .eq("city", citySlug)
      .eq("month", month),
    admin
      .from("portal_business_stats_monthly")
      .select("appearances, clicks")
      .eq("business_id", business.id)
      .eq("month", month)
      .maybeSingle(),
    admin
      .from("portal_hourly_monthly")
      .select("service_slug, hour, searches")
      .eq("brand_key", business.brand_key)
      .eq("city", citySlug)
      .eq("month", month),
    admin
      .from("portal_featured")
      .select("id")
      .eq("business_id", business.id)
      .gt("active_until", new Date().toISOString())
      .limit(1),
  ]);

  const byService = new Map<string, number>();
  for (const row of stats.data ?? []) {
    const slug = row.service_slug as string;
    if (slug) byService.set(slug, (byService.get(slug) ?? 0) + (row.views as number));
  }
  const hours = new Map<number, number>();
  for (const row of hourly.data ?? []) {
    if (serviceNames.has(row.service_slug as string))
      hours.set(
        row.hour as number,
        (hours.get(row.hour as number) ?? 0) + (row.searches as number),
      );
  }

  return {
    city,
    month,
    searches: [...serviceNames.entries()]
      .map(([slug, name]) => ({ service: name, count: byService.get(slug) ?? 0 }))
      .filter((s) => s.count >= MIN_DISPLAY_COUNT)
      .sort((a, b) => b.count - a.count),
    appearances: (own.data?.appearances as number | undefined) ?? 0,
    clicks: (own.data?.clicks as number | undefined) ?? 0,
    peakHours: [...hours.entries()]
      .filter(([, count]) => count >= MIN_DISPLAY_COUNT)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour),
    nearby: [...byService.entries()]
      .filter(([, count]) => count >= MIN_DISPLAY_COUNT)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([slug, count]) => ({
        service: serviceNames.get(slug) ?? slug.replace(/-/g, " "),
        count,
      })),
    featured: (featured.data?.length ?? 0) > 0,
  };
}

/**
 * Paragraph for the weekly summary: real demand nearby, and the Destaque suggestion when people
 * search the business's services but it rarely shows up.
 */
export async function getDemandBlock(
  business: Pick<Business, "id" | "brand_key">,
): Promise<string | null> {
  const radar = await getRadar(business);
  const top = radar.searches[0];
  if (!top || !radar.city) return null;
  const base = `Este mês, ${displayCount(top.count)} pessoas procuraram ${top.service.toLowerCase()} em ${radar.city} no portal.`;
  if (!radar.featured && radar.appearances < top.count / 2) {
    return `${base} Com o Destaque no portal, seu negócio aparece primeiro nessas buscas.`;
  }
  return base;
}
