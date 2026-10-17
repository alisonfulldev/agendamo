import type { Metadata } from "next";
import Link from "next/link";

import { getBrand } from "@/brands";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { GuideArticle, GuideCta, GuideFaq, sectionId } from "@/components/site/guide-article";
import { LinkList } from "@/components/site/link-list";
import { SitePage } from "@/components/site/site-page";
import { ARTICLE_SECTIONS, publishedArticles, type Article } from "@/content/articles";
import { formatPageDate } from "@/content/site-pages";
import { pageMetadata } from "@/lib/seo/metadata";
import { pageLabel } from "@/lib/seo/page-labels";
import { blogPostingNode, faqNode, organizationNode } from "@/lib/seo/structured-data";
import { siteUrl, withoutQuery } from "@/lib/site-url";

const articlePath = (article: Article) => `/${article.section}/${article.slug}`;

export function articleMetadata(article: Article): Metadata {
  return pageMetadata({
    title: article.title,
    description: article.description,
    path: articlePath(article),
    socialTitle: article.h1,
    type: "article",
  });
}

/**
 * Blog or help article (/recursos/<slug>, /ajuda/<slug>): breadcrumb, direct answer, table of
 * contents, author and dates, sections, sources, FAQ, related pages and a contextual CTA.
 */
export function ArticlePage({ article }: { article: Article }) {
  const section = ARTICLE_SECTIONS[article.section];
  const path = articlePath(article);
  const niche = article.niche ? getBrand(article.niche)?.niche : undefined;
  const related = [
    ...article.related.flatMap((href) => {
      const label = pageLabel(href);
      return label ? [{ label, href }] : [];
    }),
    ...publishedArticles(article.section)
      .filter((a) => a.slug !== article.slug)
      .slice(0, 2)
      .map((a) => ({ label: a.h1, href: articlePath(a) })),
  ];

  return (
    <SitePage template={article.section}>
      <Breadcrumbs
        items={[
          { name: section.name, path: `/${article.section}` },
          { name: article.h1, path },
        ]}
      />
      <GuideArticle
        h1={article.h1}
        updatedAt={article.dateModified}
        answer={article.summary}
        sections={article.sections}
        path={path}
        afterAnswer={
          <>
            <p className="mt-4 text-sm text-muted-foreground">
              {article.category} · Por {article.author.name} · Publicado em{" "}
              {formatPageDate(article.datePublished)}
            </p>
            <nav aria-labelledby="sumario" className="mt-6 rounded-2xl border bg-card p-5">
              <h2 id="sumario" className="text-sm font-semibold text-muted-foreground">
                Neste artigo
              </h2>
              <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-5">
                {article.sections.map((s) => (
                  <li key={s.title}>
                    <a href={`#${sectionId(s.title)}`} className="text-primary hover:underline">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </>
        }
      />
      {article.sources?.length ? (
        <section aria-labelledby="fontes" className="mt-10">
          <h2 id="fontes" className="text-lg font-bold">
            Fontes
          </h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {article.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  rel="noopener"
                  target="_blank"
                  className="underline underline-offset-4"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <GuideCta title={article.cta} niche={niche?.route} />
      <GuideFaq items={article.faq ?? []} />
      <LinkList id="relacionados" title="Leia também" links={related} />
      <p className="mt-10 text-sm">
        <Link href={`/${article.section}`} className="text-primary hover:underline">
          Todos os artigos de {section.name.toLowerCase()}
        </Link>
      </p>
      <JsonLd
        nodes={[
          organizationNode(),
          blogPostingNode({
            url: withoutQuery(siteUrl(path)),
            title: article.h1,
            description: article.description,
            author: article.author,
            datePublished: article.datePublished,
            dateModified: article.dateModified,
            type: article.section === "ajuda" ? "Article" : "BlogPosting",
          }),
          article.faq ? faqNode(article.faq) : null,
        ]}
      />
    </SitePage>
  );
}

/** Index of a section (/recursos, /ajuda). */
export function ArticleIndex({ section }: { section: Article["section"] }) {
  const info = ARTICLE_SECTIONS[section];
  const articles = publishedArticles(section);
  return (
    <SitePage template={section}>
      <Breadcrumbs items={[{ name: info.name, path: `/${section}` }]} />
      <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight sm:text-4xl">{info.h1}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{info.intro}</p>
      <ul className="mt-8 grid gap-4">
        {articles.map((a) => (
          <li key={a.slug}>
            <Link
              href={articlePath(a)}
              className="flex flex-col gap-1 rounded-2xl border bg-card p-5 transition-colors hover:border-primary"
            >
              <span className="text-xs font-medium text-muted-foreground">{a.category}</span>
              <span className="font-semibold">{a.h1}</span>
              <span className="text-sm text-muted-foreground">{a.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </SitePage>
  );
}
