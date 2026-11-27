import { getCurrentBrand } from "@/brands/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * App manifest of one appointment (2026-11-27): on the iPhone the customer adds this page to the
 * home screen to get reminders, and the installed app opens this same appointment.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/cancelar/[token]/manifest.webmanifest">,
) {
  const { token } = await params;
  if (!/^[0-9a-f]{32}$/.test(token)) return new Response("Not found", { status: 404 });
  const { data } = await createAdminClient()
    .from("appointments")
    .select("business:businesses(name)")
    .eq("cancel_token", token)
    .maybeSingle();
  const joined = data?.business as unknown;
  const business = (Array.isArray(joined) ? joined[0] : joined) as { name: string } | undefined;
  if (!business) return new Response("Not found", { status: 404 });
  const brand = await getCurrentBrand();
  const manifest = {
    name: `Meu horário · ${business.name}`,
    short_name: business.name.slice(0, 20),
    start_url: `/cancelar/${token}?app=1`,
    scope: `/cancelar/${token}`,
    display: "standalone",
    orientation: "portrait",
    lang: "pt-BR",
    theme_color: brand.theme.primary,
    background_color: brand.theme.background,
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json", "Cache-Control": "private, no-store" },
  });
}
