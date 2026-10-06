import { getCurrentBrand } from "@/brands/server";
import { brandUrl, hasRealDomain, isProductionDeployment } from "@/brands/urls";
import { siteUrl } from "@/lib/site-url";

/** robots.txt per brand domain. Previews and development are never indexed. */
export async function GET() {
  const brand = await getCurrentBrand();
  const body = isProductionDeployment()
    ? [
        "User-agent: *",
        "Allow: /",
        "Disallow: /painel",
        "Disallow: /admin",
        "Disallow: /api/",
        "Disallow: /auth/",
        "Disallow: /cancelar/",
        "Disallow: /avaliar/",
        "Disallow: /descadastrar",
        "Disallow: /cadastro",
        "Disallow: /entrar",
        "Disallow: /demo",
        // Links that open the creation conversation: same page, never a new one.
        "Disallow: /*?criar=",
        "Disallow: /*&criar=",
        `Sitemap: ${hasRealDomain(brand) ? brandUrl(brand, "/sitemap.xml") : siteUrl("/sitemap.xml")}`,
      ].join("\n")
    : "User-agent: *\nDisallow: /";
  return new Response(`${body}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
