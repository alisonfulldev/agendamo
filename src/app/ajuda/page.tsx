import { ArticleIndex } from "@/components/site/article-page";
import { ARTICLE_SECTIONS } from "@/content/articles";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata({
  title: ARTICLE_SECTIONS.ajuda.title,
  description: ARTICLE_SECTIONS.ajuda.description,
  path: "/ajuda",
});

export default function HelpIndexPage() {
  return <ArticleIndex section="ajuda" />;
}
