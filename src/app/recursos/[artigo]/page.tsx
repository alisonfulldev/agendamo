import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticlePage, articleMetadata } from "@/components/site/article-page";
import { getArticle, publishedArticles } from "@/content/articles";

export const dynamicParams = false;

export function generateStaticParams() {
  return publishedArticles("recursos").map((a) => ({ artigo: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/recursos/[artigo]">): Promise<Metadata> {
  const article = getArticle("recursos", (await params).artigo);
  return article ? articleMetadata(article) : {};
}

/** Blog article (/recursos/<slug>), from src/content/articles.ts. */
export default async function ResourceArticlePage({ params }: PageProps<"/recursos/[artigo]">) {
  const article = getArticle("recursos", (await params).artigo);
  if (!article) notFound();
  return <ArticlePage article={article} />;
}
