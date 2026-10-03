import { getCurrentBrand } from "@/brands/server";

/** Web app manifest for the brand of the domain: installing the panel shows the brand's name and icon. */
export async function GET() {
  const brand = await getCurrentBrand();
  const manifest = {
    name: `${brand.name} · Painel`,
    short_name: brand.name.replace(/^Lively\s+/i, ""),
    description: brand.sales.subtitle,
    start_url: "/painel",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "pt-BR",
    theme_color: brand.theme.primary,
    background_color: brand.theme.background,
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
