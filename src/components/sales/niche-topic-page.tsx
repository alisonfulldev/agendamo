import type { Metadata } from "next";
import Link from "next/link";

import { getBrand } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { LazyCreationChat } from "@/components/creation/lazy-creation-chat";
import { JsonLd } from "@/components/seo/json-ld";
import { SiteTracker } from "@/components/seo/site-tracker";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { GuideArticle, GuideCta, GuideFaq } from "@/components/site/guide-article";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { NICHE_TOPICS, TOPIC_LABELS, type TopicEntry } from "@/content/niche-guides";
import { pageMetadata } from "@/lib/seo/metadata";
import { passesQualityGate } from "@/lib/seo/quality";
import { faqNode, organizationNode } from "@/lib/seo/structured-data";
import { isStorageConfigured } from "@/lib/storage/r2";

/** Metadata of a niche subpage (/barbearia/reduzir-faltas…). */
export function topicMetadata(entry: TopicEntry): Metadata {
  return pageMetadata({
    title: entry.page.title,
    description: entry.page.description,
    path: entry.path,
    socialTitle: entry.page.h1,
    image: { url: `/og?nicho=${entry.brand.key}`, width: 1200, height: 630 },
    type: "article",
    // Quality gate: too similar or too thin pages stay out of the index.
    index: passesQualityGate(entry.path),
  });
}

/** Long-tail subpage of a niche, from src/content/niche-guides. */
export function NicheTopicPage({ entry }: { entry: TopicEntry }) {
  const { brand, guide, page } = entry;
  const niche = brand.niche!;
  const hub = `/${niche.route}`;
  const siblings = NICHE_TOPICS.filter((t) => t !== entry.topic && guide.topics[t]);
  const related = guide.related
    .map((key) => getBrand(key))
    .filter((b) => b?.niche)
    .slice(0, 4);

  return (
    <div
      data-theme-scope=""
      style={brandThemeStyle(brand)}
      className="flex min-h-full flex-col bg-background font-sans text-foreground"
    >
      <SiteHeader badge={niche.name} logo={brand.logo} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pt-4 pb-16">
        <Breadcrumbs
          items={[
            { name: niche.name, path: hub },
            { name: TOPIC_LABELS[entry.topic], path: entry.path },
          ]}
        />
        <GuideArticle
          h1={page.h1}
          updatedAt={page.updatedAt}
          answer={page.answer}
          sections={page.sections}
          notice={guide.disclaimer}
          path={entry.path}
        />
        <GuideCta
          title={`Seu link de agendamento para ${niche.name.toLowerCase()} pronto em 1 minuto.`}
          niche={niche.route}
        />
        <GuideFaq items={page.faq ?? []} />

        <nav aria-labelledby="mais" className="mt-14">
          <h2 id="mais" className="text-lg font-bold">
            Mais sobre agendamento para {niche.name.toLowerCase()}
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            <li>
              <Link
                href={hub}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Agendamento online para {niche.name.toLowerCase()}
              </Link>
            </li>
            {siblings.map((t) => (
              <li key={t}>
                <Link
                  href={`${hub}/${t}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {guide.topics[t]!.linkLabel
                    ? capitalize(guide.topics[t]!.linkLabel!)
                    : TOPIC_LABELS[t]}
                </Link>
              </li>
            ))}
          </ul>
          {related.length ? (
            <>
              <h3 className="mt-6 text-sm font-semibold text-muted-foreground">Áreas próximas</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {related.map((b) => (
                  <li key={b!.key}>
                    <Link
                      href={`/${b!.niche!.route}`}
                      className="inline-flex h-9 items-center rounded-full border bg-card px-3.5 text-sm hover:border-primary hover:text-primary"
                    >
                      {b!.niche!.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </nav>
      </main>
      <SiteFooter />
      <LazyCreationChat photos={isStorageConfigured()} />
      <SiteTracker template="subpagina" niche={brand.key} />
      <JsonLd nodes={[organizationNode(), page.faq ? faqNode(page.faq) : null]} />
    </div>
  );
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
