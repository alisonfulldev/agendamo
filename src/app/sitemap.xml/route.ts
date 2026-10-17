import { sitemapFiles, SITEMAP_HEADERS } from "@/lib/seo/sitemap-files";
import { fileLastmod, sitemapIndexXml } from "@/lib/seo/sitemaps";

/**
 * Sitemap index of the current domain: one file per section (/sitemap/<name>.xml), each with
 * the real last change of its newest URL. Sections without indexable URLs are left out.
 */
export async function GET() {
  const { files, url } = await sitemapFiles();
  const xml = sitemapIndexXml(
    files.map((file) => ({ loc: url(`/sitemap/${file.name}.xml`), lastmod: fileLastmod(file) })),
  );
  return new Response(xml, { headers: SITEMAP_HEADERS });
}
