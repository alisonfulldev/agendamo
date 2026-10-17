import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getBrand } from "@/brands";
import { HomePage } from "@/components/home/home-page";
import { nicheHomeContent } from "@/content/niche-pages";
import { getDirectoryCities } from "@/lib/directory/data";
import { pageMetadata } from "@/lib/seo/metadata";
import { passesQualityGate } from "@/lib/seo/quality";

/** Metadata of a niche page (/psicologia…): own title, description, canonical and share image. */
export function nicheMetadata(key: string): Metadata {
  const brand = getBrand(key);
  if (!brand?.niche) return {};
  const content = nicheHomeContent(brand);
  return pageMetadata({
    title: content.meta.title,
    description: content.meta.description,
    path: `/${brand.niche.route}`,
    socialTitle: content.hero.title,
    image: { url: `/og?nicho=${brand.key}`, width: 1200, height: 630 },
    index: passesQualityGate(`/${brand.niche.route}`),
  });
}

/** Niche page: the home's structure with the niche's texts, theme and examples. */
export async function NichePage({ brandKey }: { brandKey: string }) {
  const brand = getBrand(brandKey);
  if (!brand?.niche) notFound();
  const content = nicheHomeContent(brand);
  // Directory cities that are indexable get a link from the niche page.
  const cities = (await getDirectoryCities(brand.key)).filter((c) => c.indexable);
  return (
    <HomePage
      content={
        cities.length
          ? {
              ...content,
              cities: {
                title: `${brand.niche.label} por cidade`,
                links: cities.map((c) => ({
                  label: c.city,
                  href: `/${brand.niche!.route}/${c.citySlug}`,
                })),
              },
            }
          : content
      }
      brand={brand}
      niche={{ route: brand.niche.route, name: brand.niche.name }}
    />
  );
}
