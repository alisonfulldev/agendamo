import { NICHES } from "@/brands";
import { ARTICLE_SECTIONS, publishedArticles, type ArticleSection } from "@/content/articles";
import { COMPARISONS, COMPARISONS_INDEX } from "@/content/comparisons";
import { INTENT_INDEX, INTENT_PAGES } from "@/content/intent-pages";
import { publishedTopics } from "@/content/niche-guides";
import { NICHE_SEO } from "@/content/niche-seo";
import { NICHE_PAGES_UPDATED_AT, SITE_PAGES } from "@/content/site-pages";
import { TOOLS, TOOLS_INDEX } from "@/content/tools";

import { passesQualityGate } from "./quality";

/** Sitemap protocol limit per file. */
export const MAX_URLS_PER_SITEMAP = 50_000;

export interface SitemapUrl {
  loc: string;
  /** Real last change of the content (YYYY-MM-DD or ISO). Omitted when unknown. */
  lastmod?: string;
}

/** One file of the sitemap index (/sitemap/<name>.xml). */
export interface SitemapFile {
  name: string;
  urls: SitemapUrl[];
}

/** The newest of two dates (YYYY-MM-DD or ISO strings). */
function newest(a: string | undefined, b: string | undefined): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a.slice(0, 10) >= b.slice(0, 10) ? a : b;
}

/** Institutional pages of the shared MeetChat site. */
export function sitePageUrls(url: (path: string) => string): SitemapUrl[] {
  return Object.values(SITE_PAGES).map((page) => ({
    loc: url(page.path),
    lastmod: page.updatedAt,
  }));
}

/**
 * Niche sales pages (/barbearia…) that pass the quality gate, with the newer of the shared
 * template date and their own.
 */
export function nicheHubUrls(url: (path: string) => string): SitemapUrl[] {
  return NICHES.filter((brand) => passesQualityGate(`/${brand.niche!.route}`)).map((brand) => ({
    loc: url(`/${brand.niche!.route}`),
    lastmod: newest(NICHE_PAGES_UPDATED_AT, NICHE_SEO[brand.key]?.updatedAt),
  }));
}

/** Niche subpages (/barbearia/reduzir-faltas…) of published niches that pass the gate. */
export function nicheTopicUrls(url: (path: string) => string): SitemapUrl[] {
  return publishedTopics()
    .filter((t) => passesQualityGate(t.path))
    .map((t) => ({ loc: url(t.path), lastmod: t.page.updatedAt }));
}

/** Directory pages (/{nicho}/{cidade}) with enough complete profiles, dated by the newest one. */
export function directoryUrls(
  url: (path: string) => string,
  citiesByRoute: {
    route: string;
    cities: { citySlug: string; indexable: boolean; updatedAt: string }[];
  }[],
): SitemapUrl[] {
  return citiesByRoute.flatMap(({ route, cities }) =>
    cities
      .filter((c) => c.indexable)
      .map((c) => ({ loc: url(`/${route}/${c.citySlug}`), lastmod: c.updatedAt })),
  );
}

/** Cross-niche guides (/agendamento and its pages) that pass the gate. */
export function intentUrls(url: (path: string) => string): SitemapUrl[] {
  return [
    { loc: url("/agendamento"), lastmod: INTENT_INDEX.updatedAt },
    ...INTENT_PAGES.filter((p) => passesQualityGate(`/agendamento/${p.slug}`)).map((p) => ({
      loc: url(`/agendamento/${p.slug}`),
      lastmod: p.updatedAt,
    })),
  ];
}

/** Blog or help center: the section index and its published articles (none = left out). */
export function articleUrls(url: (path: string) => string, section: ArticleSection): SitemapUrl[] {
  const articles = publishedArticles(section);
  if (articles.length === 0) return [];
  return [
    { loc: url(`/${section}`), lastmod: ARTICLE_SECTIONS[section].updatedAt },
    ...articles.map((a) => ({ loc: url(`/${section}/${a.slug}`), lastmod: a.dateModified })),
  ];
}

/** Free tools (/ferramentas and each tool). */
export function toolUrls(url: (path: string) => string): SitemapUrl[] {
  return [
    { loc: url("/ferramentas"), lastmod: TOOLS_INDEX.updatedAt },
    ...TOOLS.map((t) => ({ loc: url(`/ferramentas/${t.slug}`), lastmod: t.updatedAt })),
  ];
}

/** Published comparisons (/comparar and each page); none published = section left out. */
export function comparisonUrls(url: (path: string) => string): SitemapUrl[] {
  const published = COMPARISONS.filter((c) => c.published);
  if (published.length === 0) return [];
  return [
    { loc: url("/comparar"), lastmod: COMPARISONS_INDEX.updatedAt },
    ...published.map((c) => ({ loc: url(`/comparar/${c.slug}`), lastmod: c.updatedAt })),
  ];
}

/**
 * Splits each group into files of at most MAX_URLS_PER_SITEMAP URLs ("perfis-1", "perfis-2"…);
 * a group that fits in one file keeps its plain name. Empty groups are left out.
 */
export function paginate(
  groups: { name: string; urls: SitemapUrl[] }[],
  limit = MAX_URLS_PER_SITEMAP,
): SitemapFile[] {
  return groups.flatMap(({ name, urls }) => {
    if (urls.length === 0) return [];
    if (urls.length <= limit) return [{ name, urls }];
    const files: SitemapFile[] = [];
    for (let start = 0; start < urls.length; start += limit) {
      files.push({ name: `${name}-${files.length + 1}`, urls: urls.slice(start, start + limit) });
    }
    return files;
  });
}

/** Newest lastmod of a file (for the index), if any URL has one. */
export function fileLastmod(file: SitemapFile): string | undefined {
  return file.urls.reduce<string | undefined>((acc, u) => newest(acc, u.lastmod), undefined);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const lastmodTag = (lastmod?: string) =>
  lastmod ? `<lastmod>${escapeXml(lastmod.slice(0, 10))}</lastmod>` : "";

export function urlsetXml(urls: SitemapUrl[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${escapeXml(u.loc)}</loc>${lastmodTag(u.lastmod)}</url>`).join("\n")}
</urlset>
`;
}

export function sitemapIndexXml(files: { loc: string; lastmod?: string }[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${files.map((f) => `  <sitemap><loc>${escapeXml(f.loc)}</loc>${lastmodTag(f.lastmod)}</sitemap>`).join("\n")}
</sitemapindex>
`;
}
