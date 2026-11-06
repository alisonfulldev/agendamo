import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getNiche } from "@/brands";
import { SiteAgendaLanding } from "@/components/landing/site-agenda-landing";
import { getSiteAgendaPage, SITE_AGENDA_PAGES } from "@/content/site-agenda-pages";
import { pageMetadata } from "@/lib/seo/metadata";
import { passesQualityGate } from "@/lib/seo/quality";

export const dynamicParams = false;

export function generateStaticParams() {
  return SITE_AGENDA_PAGES.map((page) => ({ ramo: page.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/site-e-agenda/[ramo]">): Promise<Metadata> {
  const page = getSiteAgendaPage((await params).ramo);
  if (!page) return {};
  const path = `/site-e-agenda/${page.slug}`;
  return pageMetadata({
    title: page.title,
    description: page.description,
    path,
    socialTitle: page.h1,
    index: passesQualityGate(path),
  });
}

/** "Site + agenda online para <profissão>" (2026-11-06), from src/content/site-agenda-pages.ts. */
export default async function SiteAgendaNichePage({ params }: PageProps<"/site-e-agenda/[ramo]">) {
  const page = getSiteAgendaPage((await params).ramo);
  if (!page) notFound();
  return (
    <SiteAgendaLanding
      page={page}
      brand={getNiche(page.nicheKey)}
      others={SITE_AGENDA_PAGES.filter((p) => p.slug !== page.slug).map((p) => ({
        label: `Para ${p.label.toLowerCase()}`,
        href: `/site-e-agenda/${p.slug}`,
      }))}
    />
  );
}
