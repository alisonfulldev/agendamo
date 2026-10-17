import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { GuideArticle, GuideCta, GuideFaq, GuideSections } from "@/components/site/guide-article";
import { SitePage } from "@/components/site/site-page";
import {
  COMPARISON_CRITERIA,
  COMPARISONS,
  getComparison,
  getCompetitor,
  MEETCHAT_FACTS,
} from "@/content/comparisons";
import { formatPageDate } from "@/content/site-pages";
import { createEntityLinker } from "@/lib/seo/entity-links";
import { pageMetadata } from "@/lib/seo/metadata";
import { faqNode, organizationNode } from "@/lib/seo/structured-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return COMPARISONS.filter((c) => c.published).map((c) => ({ comparativo: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/comparar/[comparativo]">): Promise<Metadata> {
  const page = getComparison((await params).comparativo);
  if (!page) return {};
  return pageMetadata({
    title: page.title,
    description: page.description,
    path: `/comparar/${page.slug}`,
    socialTitle: page.h1,
    type: "article",
  });
}

/** Comparison page (/comparar/meetchat-vs-…), data and sources in src/content/comparisons.ts. */
export default async function ComparisonRoute({ params }: PageProps<"/comparar/[comparativo]">) {
  const page = getComparison((await params).comparativo);
  if (!page) notFound();
  const competitor = getCompetitor(page.competitor);

  return (
    <SitePage template="comparar">
      <Breadcrumbs
        items={[
          { name: "Comparativos", path: "/comparar" },
          { name: page.label, path: `/comparar/${page.slug}` },
        ]}
      />
      <GuideArticle
        h1={page.h1}
        updatedAt={page.updatedAt}
        answer={page.answer}
        sections={[]}
        path={`/comparar/${page.slug}`}
      />
      {competitor ? (
        <section aria-labelledby="tabela" className="mt-10">
          <h2 id="tabela" className="text-2xl font-bold tracking-tight">
            Comparação lado a lado
          </h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <caption className="sr-only">MeetChat comparado com {competitor.name}</caption>
              <thead className="bg-muted/60">
                <tr>
                  <th scope="col" className="p-3 font-semibold">
                    Critério
                  </th>
                  <th scope="col" className="p-3 font-semibold">
                    MeetChat
                  </th>
                  <th scope="col" className="p-3 font-semibold">
                    {competitor.name}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {COMPARISON_CRITERIA.map((criterion) => {
                  const fact = competitor.facts[criterion.key];
                  return (
                    <tr key={criterion.key} className="align-top">
                      <th scope="row" className="p-3 font-medium">
                        {criterion.label}
                      </th>
                      <td className="p-3">{MEETCHAT_FACTS[criterion.key]}</td>
                      <td className="p-3 text-muted-foreground">
                        {fact ? fact.value : <em>Não verificado</em>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Informações de {competitor.name} verificadas em {formatPageDate(competitor.verifiedAt)}{" "}
            em:{" "}
            {competitor.sources.map((source, index) => (
              <span key={source.url}>
                {index > 0 ? ", " : ""}
                <a
                  href={source.url}
                  rel="nofollow noopener"
                  target="_blank"
                  className="underline underline-offset-4"
                >
                  {source.label}
                </a>
              </span>
            ))}
            . Recursos e preços mudam: confira a fonte antes de decidir.
          </p>
        </section>
      ) : null}
      <GuideSections
        sections={page.sections}
        linker={createEntityLinker({ currentPath: `/comparar/${page.slug}` })}
      />
      <GuideCta title="Teste o MeetChat com o seu negócio: o link fica pronto em 1 minuto." />
      <GuideFaq items={page.faq} />
      <JsonLd nodes={[organizationNode(), faqNode(page.faq)]} />
    </SitePage>
  );
}
