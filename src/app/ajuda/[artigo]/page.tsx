import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticlePage, articleMetadata } from "@/components/site/article-page";
import { getArticle, publishedArticles } from "@/content/articles";

export const dynamicParams = false;

export function generateStaticParams() {
  return publishedArticles("ajuda").map((a) => ({ artigo: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/ajuda/[artigo]">): Promise<Metadata> {
  const article = getArticle("ajuda", (await params).artigo);
  return article ? articleMetadata(article) : {};
}

/** Help article (/ajuda/<slug>), from src/content/articles.ts. */
export default async function HelpArticlePage({ params }: PageProps<"/ajuda/[artigo]">) {
  const article = getArticle("ajuda", (await params).artigo);
  if (!article) notFound();
  return <ArticlePage article={article} />;
}
