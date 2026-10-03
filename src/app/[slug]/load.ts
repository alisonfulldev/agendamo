import "server-only";

import type { Metadata } from "next";
import { cache, type CSSProperties } from "react";

import { DEFAULT_BRAND, getBrand } from "@/brands";
import { getCurrentBrand } from "@/brands/server";
import { readableOn } from "@/brands/theme";
import { brandUrl } from "@/brands/urls";
import { getPlanFeatures } from "@/lib/plans";
import { getPublicPage, type PublicPage } from "@/lib/public/page";
import { isValidSlugFormat } from "@/lib/slug";
import { publicUrl } from "@/lib/storage/r2";

/** Business page data for /<slug> (chat) and /<slug>/perfil (profile). Cached per request. */
export const loadBusinessPage = cache(async (slug: string) => {
  if (!isValidSlugFormat(slug)) return null;
  const domainBrand = await getCurrentBrand();
  const data = await getPublicPage(domainBrand.key, slug);
  if (!data) return null;
  const brand = getBrand(data.business.brand_key) ?? DEFAULT_BRAND;
  const features = getPlanFeatures({
    ...data.business,
    trial_started_at: data.business.trial_started_at ?? null,
  });
  return { data, domainBrand, brand, features };
});

export type LoadedBusinessPage = NonNullable<Awaited<ReturnType<typeof loadBusinessPage>>>;

/** Owner's own color (optional) applied over the brand theme. */
export function themeOverride(loaded: LoadedBusinessPage): CSSProperties | undefined {
  const override = loaded.data.page?.primary_color_override;
  return override
    ? ({
        "--brand-primary": override,
        "--brand-primary-foreground": readableOn(override, loaded.brand.theme),
      } as CSSProperties)
    : undefined;
}

/** Rule 12: profiles are indexed only with minimum content (same criteria as complete_businesses). */
export function isCompleteProfile(data: PublicPage): boolean {
  return (
    Boolean(data.page?.avatar_key) &&
    (data.page?.bio?.length ?? 0) >= 30 &&
    Boolean(data.page?.city) &&
    data.services.filter((s) => s.price_cents > 0).length >= 3
  );
}

/** Same metadata for the chat and the profile; the profile is the canonical (indexable) URL. */
export function businessMetadata(loaded: LoadedBusinessPage | null): Metadata {
  if (!loaded) return { title: "Página não encontrada", robots: { index: false } };
  const { data, brand } = loaded;
  const image = publicUrl(data.page?.cover_key) ?? publicUrl(data.page?.avatar_key);
  const description = data.page?.bio ?? `${data.business.name}: veja serviços, preços e agende.`;
  return {
    title: { absolute: `${data.business.name} · ${brand.name}` },
    description,
    robots: isCompleteProfile(data) ? undefined : { index: false, follow: true },
    alternates: { canonical: brandUrl(brand, `/${data.business.slug}/perfil`).split("?")[0] },
    openGraph: {
      type: "profile",
      title: data.business.name,
      description,
      siteName: brand.name,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export function businessJsonLd(data: PublicPage) {
  const avatar = publicUrl(data.page?.avatar_key);
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: data.business.name,
    description: data.page?.bio ?? undefined,
    image: avatar ?? undefined,
    address: data.page?.city
      ? {
          "@type": "PostalAddress",
          streetAddress: data.page.address ?? undefined,
          addressLocality: data.page.city,
          addressCountry: "BR",
        }
      : undefined,
    aggregateRating:
      data.rating.count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: data.rating.average,
            reviewCount: data.rating.count,
          }
        : undefined,
  };
}
