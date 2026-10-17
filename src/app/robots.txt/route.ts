import { getCurrentBrand } from "@/brands/server";
import { canonicalUrl, hasRealDomain, isProductionDeployment } from "@/brands/urls";
import { robotsTxt } from "@/lib/seo/robots";
import { siteUrl, withoutQuery } from "@/lib/site-url";

/** robots.txt per brand domain (rules in src/lib/seo/robots.ts). */
export async function GET() {
  const brand = await getCurrentBrand();
  const sitemapUrl = hasRealDomain(brand)
    ? canonicalUrl(brand, "/sitemap.xml")
    : withoutQuery(siteUrl("/sitemap.xml"));
  return new Response(robotsTxt({ production: isProductionDeployment(), sitemapUrl }), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
