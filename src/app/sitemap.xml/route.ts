import { BRANDS, NICHES } from "@/brands";
import { getCurrentBrand } from "@/brands/server";
import { brandUrl, hasRealDomain } from "@/brands/urls";
import { indexableBusinessSlugs, indexablePortalPaths } from "@/lib/portal/seo";

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Sitemap. On a niche's own real domain: its sales page, complete business profiles and portal
 * pages. On the MeetChat site (shared domain): the generic home, every niche page and the
 * complete profiles of every niche.
 */
export async function GET() {
  const brand = await getCurrentBrand();
  const ownDomain = hasRealDomain(brand);
  const keys = ownDomain ? [brand.key] : BRANDS.map((b) => b.key);
  const [businessLists, portal] = await Promise.all([
    Promise.all(keys.map((key) => indexableBusinessSlugs(key))),
    ownDomain ? indexablePortalPaths(brand.key) : Promise.resolve([] as string[]),
  ]);
  const businesses = businessLists.flat();
  const base = (path: string) => brandUrl(brand, path).split("?")[0]!;
  const urls: { loc: string; priority: string; lastmod?: string }[] = [
    { loc: base("/"), priority: "1.0" },
    ...(ownDomain
      ? []
      : NICHES.map((niche) => ({ loc: base(`/${niche.niche!.route}`), priority: "0.9" }))),
    { loc: base("/cadastro"), priority: "0.6" },
    { loc: base("/termos"), priority: "0.2" },
    { loc: base("/privacidade"), priority: "0.2" },
    ...portal.map((path) => ({ loc: base(path), priority: "0.7" })),
    ...businesses.map((b) => ({
      loc: base(`/${b.slug}/perfil`),
      priority: "0.8",
      lastmod: b.updatedAt,
    })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod.slice(0, 10)}</lastmod>` : ""}<priority>${u.priority}</priority></url>`,
  )
  .join("\n")}
</urlset>`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
