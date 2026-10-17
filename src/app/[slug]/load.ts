import "server-only";

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache, type CSSProperties } from "react";

import { getNiche } from "@/brands";
import { getCurrentBrand, isSharedDomain } from "@/brands/server";
import { readableOn } from "@/brands/theme";
import { canonicalUrl, nicheHubUrl } from "@/brands/urls";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbNode, localBusinessNode, type JsonLdNode } from "@/lib/seo/structured-data";
import { getPlanFeatures } from "@/lib/plans";
import { isIndexable } from "@/lib/public/indexable";
import { getPublicPage, suspendedBusinessBrand } from "@/lib/public/page";
import { isValidSlugFormat } from "@/lib/slug";
import { publicUrl } from "@/lib/storage/r2";

/** Business page data for /<slug> (chat) and /<slug>/perfil (profile). Cached per request. */
export const loadBusinessPage = cache(async (slug: string) => {
  if (!isValidSlugFormat(slug)) return null;
  const domainBrand = await getCurrentBrand();
  const data = await getPublicPage(domainBrand.key, slug);
  if (!data) return null;
  const brand = getNiche(data.business.brand_key);
  const features = getPlanFeatures(data.business);
  // Waiting mode (no trial, no subscription): the chat hands off to WhatsApp.
  const automaticBooking = features.active;
  // On the shared domain the page shows in the business's brand right there (one URL per
  // business, no ?brand= redirect). Only a niche's own real domain sends other niches away.
  const wrongDomain = brand.key !== domainBrand.key && !(await isSharedDomain());
  return { data, domainBrand, brand, features, automaticBooking, wrongDomain };
});

/**
 * A business page that is gone: a suspended business sends visitors to its niche page (307, as
 * the suspension can be lifted); a link that never existed or was deleted is a real 404.
 */
export async function businessGone(slug: string): Promise<never> {
  const brandKey = isValidSlugFormat(slug) ? await suspendedBusinessBrand(slug) : null;
  if (brandKey) redirect(nicheHubUrl(getNiche(brandKey)));
  notFound();
}

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

/** Same metadata for the chat and the profile; the profile is the canonical (indexable) URL. */
export function businessMetadata(loaded: LoadedBusinessPage | null): Metadata {
  if (!loaded) return { title: "Página não encontrada", robots: { index: false } };
  const { data, brand } = loaded;
  const image = publicUrl(data.page?.cover_key) ?? publicUrl(data.page?.avatar_key);
  const description = data.page?.bio ?? `${data.business.name}: veja serviços, preços e agende.`;
  return pageMetadata({
    title: `${data.business.name} · ${brand.name}`,
    description,
    path: `/${data.business.slug}/perfil`,
    brand,
    siteName: brand.name,
    socialTitle: data.business.name,
    type: "profile",
    image: image ? { url: image } : null,
    index: isIndexable(data),
  });
}

/** Structured data of the business: LocalBusiness (+ breadcrumb on the standalone profile). */
export function businessStructuredData(
  loaded: LoadedBusinessPage,
  { breadcrumb = false }: { breadcrumb?: boolean } = {},
): JsonLdNode[] {
  const { data, brand } = loaded;
  const { business, page } = data;
  const url = canonicalUrl(brand, `/${business.slug}/perfil`);
  const node = localBusinessNode(
    {
      name: business.name,
      bio: page?.bio ?? null,
      url,
      bookingUrl: canonicalUrl(brand, `/${business.slug}`),
      bookingOnline: loaded.automaticBooking,
      images: [page?.avatar_key, page?.cover_key, ...data.photos.map((p) => p.key)]
        .map((key) => publicUrl(key))
        .filter((u): u is string => Boolean(u)),
      address: {
        street: page?.address ?? null,
        neighborhood: page?.neighborhood ?? null,
        city: page?.city ?? null,
      },
      instagramUrl: page?.instagram_url ?? null,
      showPrices: page?.show_prices ?? true,
      services: data.services.map((s) => ({
        name: s.name,
        description: s.description,
        priceCents: s.price_cents,
      })),
    },
    brand,
  );
  if (!breadcrumb) return [node];
  const hub = brand.niche ? { name: brand.niche.name, url: nicheHubUrl(brand) } : null;
  return [
    node,
    breadcrumbNode([
      { name: "Início", url: canonicalUrl(brand, "/") },
      ...(hub ? [hub] : []),
      { name: business.name, url },
    ]),
  ];
}
