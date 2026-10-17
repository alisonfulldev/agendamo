import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getBrand, type BrandConfig } from "@/brands";
import { HomePage } from "@/components/home/home-page";
import { LandingPage, type LinkGroup } from "@/components/landing/landing-page";
import { NICHE_LANDINGS, type LandingCopy } from "@/content/copy/landing";
import { getPublishedGuide, NICHE_TOPICS, TOPIC_LABELS } from "@/content/niche-guides";
import { TOOLS } from "@/content/tools";
import { nicheHomeContent } from "@/content/niche-pages";
import { getDirectoryCities } from "@/lib/directory/data";
import { experimentVariant } from "@/lib/experiments-server";
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
  const landing = NICHE_LANDINGS[brand.key];
  if (landing) return <NicheLanding brand={brand} copy={landing} />;
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

/** Redesigned niche hub (niches with copy in src/content/copy/landing.ts). */
async function NicheLanding({ brand, copy }: { brand: BrandConfig; copy: LandingCopy }) {
  const niche = brand.niche!;
  const content = nicheHomeContent(brand);
  const guide = getPublishedGuide(brand.key);
  const cities = (await getDirectoryCities(brand.key)).filter((c) => c.indexable);
  const related = (guide?.related ?? [])
    .map((key) => getBrand(key))
    .filter((b): b is BrandConfig => Boolean(b?.niche));
  const extras: LinkGroup[] = [
    {
      title: `Guias para ${niche.name.toLowerCase()}`,
      links: guide
        ? NICHE_TOPICS.filter((t) => guide.topics[t]).map((t) => ({
            label: TOPIC_LABELS[t],
            href: `/${niche.route}/${t}`,
          }))
        : [],
    },
    {
      title: "Ferramentas grátis",
      links: TOOLS.map((t) => ({ label: t.label, href: `/ferramentas/${t.slug}` })),
    },
    {
      title: `${niche.name} por cidade`,
      links: cities.map((c) => ({ label: c.city, href: `/${niche.route}/${c.citySlug}` })),
    },
    {
      title: "Áreas próximas",
      links: related.map((b) => ({ label: b.niche!.name, href: `/${b.niche!.route}` })),
    },
  ].filter((group) => group.links.length > 0);

  return (
    <LandingPage
      copy={copy}
      description={content.meta.description}
      faq={content.faq}
      brand={brand}
      niche={{ route: niche.route, name: niche.name }}
      extras={extras}
      experiment={await experimentVariant(`/${niche.route}`)}
    />
  );
}
