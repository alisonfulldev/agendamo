import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NoShowBlock, TopicVisual } from "@/components/landing/topic-blocks";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { GuideArticle, GuideCta, GuideFaq } from "@/components/site/guide-article";
import { LinkList } from "@/components/site/link-list";
import { SitePage } from "@/components/site/site-page";
import { getIntentPage, INTENT_PAGES } from "@/content/intent-pages";
import { publishedTopics } from "@/content/niche-guides";
import { TOOL_LINKS_BY_INTENT } from "@/content/tools";
import { pageMetadata } from "@/lib/seo/metadata";
import { passesQualityGate } from "@/lib/seo/quality";
import { faqNode, organizationNode } from "@/lib/seo/structured-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return INTENT_PAGES.map((page) => ({ tema: page.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/agendamento/[tema]">): Promise<Metadata> {
  const page = getIntentPage((await params).tema);
  if (!page) return {};
  const path = `/agendamento/${page.slug}`;
  return pageMetadata({
    title: page.title,
    description: page.description,
    path,
    socialTitle: page.h1,
    type: "article",
    index: passesQualityGate(path),
  });
}

/** Cross-niche intent page (/agendamento/link-na-bio…), from src/content/intent-pages.ts. */
export default async function IntentPageRoute({ params }: PageProps<"/agendamento/[tema]">) {
  const page = getIntentPage((await params).tema);
  if (!page) notFound();
  const path = `/agendamento/${page.slug}`;
  const byNiche = page.nicheTopic
    ? publishedTopics()
        .filter((t) => t.topic === page.nicheTopic)
        .map((t) => ({ label: t.brand.niche!.name, href: t.path }))
    : [];
  const related = page.related
    .map((slug) => getIntentPage(slug))
    .filter((p) => p !== null)
    .map((p) => ({ label: p.label, href: `/agendamento/${p.slug}` }));

  return (
    <SitePage template="agendamento">
      <Breadcrumbs
        items={[
          { name: "Guias de agendamento", path: "/agendamento" },
          { name: page.label, path },
        ]}
      />
      <GuideArticle
        h1={page.h1}
        updatedAt={page.updatedAt}
        answer={page.answer}
        sections={page.sections}
        path={path}
        afterAnswer={<TopicVisual topic={page.slug} />}
      />
      {page.slug === "reduzir-faltas" ? <NoShowBlock /> : null}
      {byNiche.length ? (
        <nav aria-labelledby="por-area" className="mt-10">
          <h2 id="por-area" className="text-lg font-bold">
            O mesmo guia para a sua área
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {byNiche.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex h-9 items-center rounded-full border bg-card px-3.5 text-sm hover:border-primary hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <GuideCta title="Seu link de agendamento pronto em 1 minuto." />
      <GuideFaq items={page.faq ?? []} />
      <LinkList
        id="veja-tambem"
        title="Veja também"
        links={[...related, ...(TOOL_LINKS_BY_INTENT[page.slug] ?? [])]}
      />
      <JsonLd nodes={[organizationNode(), page.faq ? faqNode(page.faq) : null]} />
    </SitePage>
  );
}
