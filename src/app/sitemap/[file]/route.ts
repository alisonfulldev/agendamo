import { sitemapFiles, SITEMAP_HEADERS } from "@/lib/seo/sitemap-files";
import { urlsetXml } from "@/lib/seo/sitemaps";

/** One section of the sitemap index (/sitemap/site.xml, /sitemap/perfis-2.xml…). */
export async function GET(_request: Request, { params }: RouteContext<"/sitemap/[file]">) {
  const { file } = await params;
  const name = file.endsWith(".xml") ? file.slice(0, -4) : null;
  const { files } = await sitemapFiles();
  const match = files.find((f) => f.name === name);
  if (!match) return new Response("Not found", { status: 404 });
  return new Response(urlsetXml(match.urls), { headers: SITEMAP_HEADERS });
}
