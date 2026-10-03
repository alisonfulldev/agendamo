import { ImageResponse } from "next/og";

import { getCurrentBrand } from "@/brands/server";
import { readableOn } from "@/brands/theme";

const SIZES = new Set([96, 180, 192, 512]);

/** App icon in the brand of the domain (PWA manifest, push notifications, Apple touch icon). */
export async function GET(_request: Request, { params }: RouteContext<"/icons/[size]">) {
  const { size: raw } = await params;
  const size = Number(raw);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  const brand = await getCurrentBrand();
  const { theme } = brand;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: theme.primary,
        color: readableOn(theme.primary, theme),
        fontSize: size * 0.55,
        fontWeight: 700,
        fontFamily: "sans-serif",
      }}
    >
      {brand.name
        .replace(/^Lively\s+/i, "")
        .charAt(0)
        .toUpperCase()}
    </div>,
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
