import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getNiche } from "@/brands";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { GuideArticle, GuideCta, GuideFaq } from "@/components/site/guide-article";
import { LinkList } from "@/components/site/link-list";
import { SitePage } from "@/components/site/site-page";
import { getSiteAgendaPage, SITE_AGENDA_PAGES } from "@/content/site-agenda-pages";
import { pageMetadata } from "@/lib/seo/metadata";
import { passesQualityGate } from "@/lib/seo/quality";
import { faqNode, organizationNode } from "@/lib/seo/structured-data";

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
    type: "article",
    index: passesQualityGate(path),
  });
}

/** "Site + agenda online para <profissão>" (2026-11-06), from src/content/site-agenda-pages.ts. */
export default async function SiteAgendaNichePage({ params }: PageProps<"/site-e-agenda/[ramo]">) {
  const page = getSiteAgendaPage((await params).ramo);
  if (!page) notFound();
  const path = `/site-e-agenda/${page.slug}`;
  const niche = getNiche(page.nicheKey).niche;
  const others = SITE_AGENDA_PAGES.filter((p) => p.slug !== page.slug).map((p) => ({
    label: `Para ${p.label.toLowerCase()}`,
    href: `/site-e-agenda/${p.slug}`,
  }));

  return (
    <SitePage template="site-e-agenda">
      <Breadcrumbs
        items={[
          { name: "Site + agenda online", path: "/site-e-agenda" },
          { name: page.label, path },
        ]}
      />
      <GuideArticle
        h1={page.h1}
        updatedAt={page.updatedAt}
        answer={page.answer}
        sections={page.sections}
        path={path}
        afterAnswer={
          niche ? (
            <p className="mt-6 flex flex-wrap gap-2">
              <Link
                href={`/exemplo/${niche.route}`}
                className="inline-flex h-10 items-center rounded-full border bg-card px-4 text-sm font-semibold hover:border-primary hover:text-primary"
              >
                Ver um site de exemplo
              </Link>
              <Link
                href={`/exemplo/${niche.route}?modelo=elegante`}
                className="inline-flex h-10 items-center rounded-full border bg-card px-4 text-sm font-semibold hover:border-primary hover:text-primary"
              >
                Ver o modelo Elegante
              </Link>
            </p>
          ) : null
        }
      />
      <GuideCta
        title="Seu site + agenda online, pronto para testar agora."
        niche={niche?.route}
        label="Comece grátis, sem cartão"
      />
      <GuideFaq items={page.faq} />
      <LinkList
        id="outras-areas"
        title="Site + agenda para outras áreas"
        links={[
          ...(niche
            ? [{ label: `MeetChat para ${niche.name.toLowerCase()}`, href: `/${niche.route}` }]
            : []),
          { label: "Preços", href: "/precos" },
          ...others,
        ]}
      />
      <JsonLd nodes={[organizationNode(), faqNode(page.faq)]} />
    </SitePage>
  );
}
