import "server-only";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentBrand } from "@/brands/server";
import { brandUrl } from "@/brands/urls";
import { PortalListing } from "@/components/portal/listing";
import { isValidSlugFormat, slugify } from "@/lib/slug";

import {
  getPortalIndex,
  getPortalListing,
  getPortalRecentReviews,
  MIN_INDEXABLE_LISTING,
} from "./data";

interface Params {
  city: string;
  neighborhood: string | null;
  service: string;
}

const valid = (value: string | null) =>
  value === null || isValidSlugFormat(value) || /^[a-z0-9]{2}$/.test(value);

async function load({ city, neighborhood, service }: Params) {
  if (!valid(city) || !valid(service) || !valid(neighborhood)) return null;
  const brand = await getCurrentBrand();
  const [items, index] = await Promise.all([
    getPortalListing(brand.key, city, service, neighborhood),
    getPortalIndex(brand.key),
  ]);
  const entry = index.find((i) => i.city_slug === city && i.service_slug === service);
  if (!entry || items.length === 0) return null;
  const neighborhoodName = neighborhood
    ? (items.find((i) => i.neighborhood)?.neighborhood ?? neighborhood)
    : null;
  return { brand, items, index, entry, neighborhoodName };
}

/** Pages with fewer than 3 complete businesses are noindex (and out of the sitemap, rule 12). */
export async function portalListingMetadata(params: Params): Promise<Metadata> {
  const data = await load(params);
  if (!data) return { title: "Página não encontrada", robots: { index: false } };
  const place = data.neighborhoodName
    ? `${data.neighborhoodName}, ${data.entry.city}`
    : data.entry.city;
  const path = `/explorar/${params.city}${params.neighborhood ? `/${params.neighborhood}` : ""}/${params.service}`;
  return {
    title: `${data.entry.service_name} em ${place} · ${data.brand.name}`,
    description: `${data.items.length} negócios de ${data.entry.service_name.toLowerCase()} em ${place}. Veja preços, avaliações e agende online.`,
    alternates: { canonical: brandUrl(data.brand, path).split("?")[0] },
    robots: data.items.length >= MIN_INDEXABLE_LISTING ? undefined : { index: false, follow: true },
  };
}

export async function PortalListingPage(params: Params) {
  const data = await load(params);
  if (!data) notFound();
  const { brand, items, index, entry, neighborhoodName } = data;
  const place = neighborhoodName ? `${neighborhoodName}, ${entry.city}` : entry.city;
  const reviews = await getPortalRecentReviews(brand.key, params.city, params.service);
  const neighborhoods = [...new Set(items.map((i) => i.neighborhood).filter(Boolean))] as string[];
  const related = [
    ...index
      .filter(
        (i) =>
          i.city_slug === params.city &&
          i.service_slug !== params.service &&
          i.businesses >= MIN_INDEXABLE_LISTING,
      )
      .slice(0, 8)
      .map((i) => ({
        href: `/explorar/${i.city_slug}/${i.service_slug}`,
        label: `${i.service_name} em ${i.city}`,
      })),
    ...(params.neighborhood
      ? []
      : neighborhoods.slice(0, 8).map((n) => ({
          href: `/explorar/${params.city}/${slugify(n)}/${params.service}`,
          label: `${entry.service_name} em ${n}`,
        }))),
  ];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-10">
      <nav aria-label="Caminho" className="text-sm text-muted-foreground">
        <Link href="/explorar" className="text-primary">
          Explorar
        </Link>{" "}
        › {entry.city}
        {neighborhoodName ? ` › ${neighborhoodName}` : ""}
      </nav>
      <h1 className="text-3xl font-bold">
        {entry.service_name} em {place}
      </h1>
      <PortalListing
        brand={brand}
        serviceName={entry.service_name}
        placeName={place}
        citySlug={params.city}
        neighborhoodSlug={params.neighborhood}
        serviceSlug={params.service}
        items={items}
        reviews={reviews}
        related={related}
      />
    </main>
  );
}
