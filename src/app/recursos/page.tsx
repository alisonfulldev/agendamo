import { ArticleIndex } from "@/components/site/article-page";
import { ARTICLE_SECTIONS } from "@/content/articles";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata({
  title: ARTICLE_SECTIONS.recursos.title,
  description: ARTICLE_SECTIONS.recursos.description,
  path: "/recursos",
});

export default function ResourcesIndexPage() {
  return <ArticleIndex section="recursos" />;
}
