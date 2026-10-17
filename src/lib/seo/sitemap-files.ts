import "server-only";

import { BRANDS, NICHES } from "@/brands";
import { getCurrentBrand } from "@/brands/server";
import { canonicalUrl, hasRealDomain } from "@/brands/urls";
import { getDirectoryCities } from "@/lib/directory/data";
import { indexableBusinessSlugs, indexablePortalPaths } from "@/lib/portal/seo";
import { siteUrl, withoutQuery } from "@/lib/site-url";

import { SITE_PAGES } from "@/content/site-pages";

import {
  articleUrls,
  comparisonUrls,
  directoryUrls,
  intentUrls,
  nicheHubUrls,
  nicheTopicUrls,
  paginate,
  sitePageUrls,
  toolUrls,
  type SitemapFile,
} from "./sitemaps";

/**
 * Files of the sitemap index for the current domain. On the shared MeetChat site: institutional
 * pages, niche pages and the complete profiles of every niche. On a niche's own real domain: its
 * home, legal pages, complete profiles and portal pages. Only indexable URLs ever go in.
 */
export async function sitemapFiles(): Promise<{
  files: SitemapFile[];
  url: (p: string) => string;
}> {
  const brand = await getCurrentBrand();
  const ownDomain = hasRealDomain(brand);
  const url = (path: string) =>
    ownDomain ? canonicalUrl(brand, path) : withoutQuery(siteUrl(path));
  const keys = ownDomain ? [brand.key] : BRANDS.map((b) => b.key);
  const [businessLists, portal, directory] = await Promise.all([
    Promise.all(keys.map((key) => indexableBusinessSlugs(key))),
    ownDomain ? indexablePortalPaths(brand.key) : Promise.resolve([] as string[]),
    ownDomain
      ? Promise.resolve([])
      : Promise.all(
          NICHES.map(async (b) => ({
            route: b.niche!.route,
            cities: await getDirectoryCities(b.key),
          })),
        ),
  ]);

  // A niche's own domain shows its sales page at "/" (no recorded date for it yet).
  const site = ownDomain
    ? [
        { loc: url("/") },
        ...[SITE_PAGES.terms, SITE_PAGES.privacy].map((p) => ({
          loc: url(p.path),
          lastmod: p.updatedAt,
        })),
      ]
    : sitePageUrls(url);

  const files = paginate([
    { name: "site", urls: site },
    { name: "nichos", urls: ownDomain ? [] : nicheHubUrls(url) },
    { name: "subpaginas", urls: ownDomain ? [] : nicheTopicUrls(url) },
    { name: "agendamento", urls: ownDomain ? [] : intentUrls(url) },
    { name: "ferramentas", urls: ownDomain ? [] : toolUrls(url) },
    { name: "comparar", urls: ownDomain ? [] : comparisonUrls(url) },
    { name: "blog", urls: ownDomain ? [] : articleUrls(url, "recursos") },
    { name: "ajuda", urls: ownDomain ? [] : articleUrls(url, "ajuda") },
    {
      name: "perfis",
      urls: businessLists
        .flat()
        .map((b) => ({ loc: url(`/${b.slug}/perfil`), lastmod: b.updatedAt })),
    },
    {
      name: "diretorio",
      urls: [...directoryUrls(url, directory), ...portal.map((path) => ({ loc: url(path) }))],
    },
  ]);
  return { files, url };
}

export const SITEMAP_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600",
};
