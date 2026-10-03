import { getCurrentBrand } from "@/brands/server";
import { brandUrl, isProductionDeployment } from "@/brands/urls";

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
        `Sitemap: ${brandUrl(brand, "/sitemap.xml")}`,
      ].join("\n")
    : "User-agent: *\nDisallow: /";
  return new Response(`${body}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
