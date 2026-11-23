import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs, breadcrumbTrailNode, type Crumb } from "@/components/site/breadcrumbs";
import { GuideArticle, GuideFaq } from "@/components/site/guide-article";
import { LinkList } from "@/components/site/link-list";
import { PartnerCta } from "@/components/site/partner-cta";
import { SitePage } from "@/components/site/site-page";
import { getIncomePage, INCOME_PAGES } from "@/content/income-pages";
import { pageMetadata } from "@/lib/seo/metadata";
import { passesQualityGate } from "@/lib/seo/quality";
import { faqNode, ORGANIZATION_ID, organizationNode } from "@/lib/seo/structured-data";
import { siteUrl, withoutQuery } from "@/lib/site-url";

export const dynamicParams = false;

export function generateStaticParams() {
  return INCOME_PAGES.map((page) => ({ tema: page.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/renda-extra/[tema]">): Promise<Metadata> {
  const page = getIncomePage((await params).tema);
  if (!page) return {};
  const path = `/renda-extra/${page.slug}`;
  return pageMetadata({
    title: page.title,
    description: page.description,
    path,
    socialTitle: page.h1,
    type: "article",
    index: passesQualityGate(path),
  });
}

/** Long-tail income page (/renda-extra/pelo-celular…), from src/content/income-pages.ts. */
export default async function IncomePageRoute({ params }: PageProps<"/renda-extra/[tema]">) {
  const page = getIncomePage((await params).tema);
  if (!page) notFound();
  const path = `/renda-extra/${page.slug}`;
  const url = withoutQuery(siteUrl(path));
  const related = page.related
    .map((slug) => getIncomePage(slug))
    .filter((p) => p !== null)
    .map((p) => ({ label: p.label, href: `/renda-extra/${p.slug}` }));

  const crumbs: Crumb[] = [
    { name: "Renda extra", path: "/renda-extra" },
    { name: page.label, path },
  ];
  return (
    <SitePage template="outro">
      <Breadcrumbs items={crumbs} jsonLd={false} />
      <GuideArticle
        h1={page.h1}
        updatedAt={page.updatedAt}
        answer={page.answer}
        sections={page.sections}
        path={path}
      />
      <PartnerCta />
      <GuideFaq items={page.faq} />
      <LinkList
        id="veja-tambem"
        title="Veja também"
        links={[
          ...related,
          { label: "Programa de parceiros: regras e simulação", href: "/parceiros" },
          { label: "Todas as formas de renda extra com o MeetChat", href: "/renda-extra" },
        ]}
      />
      <JsonLd
        nodes={[
          organizationNode(),
          breadcrumbTrailNode(crumbs),
          {
            "@type": "Article",
            "@id": `${url}#article`,
            headline: page.h1,
            description: page.description,
            url,
            mainEntityOfPage: url,
            dateModified: page.updatedAt,
            datePublished: page.updatedAt,
            inLanguage: "pt-BR",
            author: { "@id": ORGANIZATION_ID },
            publisher: { "@id": ORGANIZATION_ID },
          },
          faqNode(page.faq),
        ]}
      />
    </SitePage>
  );
}
