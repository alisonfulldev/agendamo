import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getBrand } from "@/brands";
import { HomePage } from "@/components/home/home-page";
import { nicheHomeContent } from "@/content/niche-pages";
import { siteUrl } from "@/lib/site-url";

/** Metadata of a niche page (/psicologia…): own title, description, canonical and share image. */
export function nicheMetadata(key: string): Metadata {
  const brand = getBrand(key);
  if (!brand?.niche) return {};
  const content = nicheHomeContent(brand);
  const url = siteUrl(`/${brand.niche.route}`);
  return {
    title: { absolute: content.meta.title },
    description: content.meta.description,
    alternates: { canonical: url },
    openGraph: {
      title: content.hero.title,
      description: content.meta.description,
      url,
      siteName: "MeetChat",
      locale: "pt_BR",
      type: "website",
      images: [{ url: `/og?nicho=${brand.key}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

/** Niche page: the home's structure with the niche's texts, theme and examples. */
export function NichePage({ brandKey }: { brandKey: string }) {
  const brand = getBrand(brandKey);
  if (!brand?.niche) notFound();
  return (
    <HomePage
      content={nicheHomeContent(brand)}
      brand={brand}
      niche={{ route: brand.niche.route, name: brand.niche.name }}
    />
  );
}
