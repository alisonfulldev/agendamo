import { ImageResponse } from "next/og";

import { PLATFORM } from "@/brands";
import { getCurrentBrand } from "@/brands/server";
import { readableOn } from "@/brands/theme";
import { hasRealDomain } from "@/brands/urls";

const SIZES = new Set([32, 48, 96, 180, 192, 512]);

/**
 * App icon in the brand of the domain (PWA manifest, push notifications, Apple touch icon): the
 * MeetChat mark, three "typing" dots on the brand color (same drawing as the logo SVGs).
 */
export async function GET(_request: Request, { params }: RouteContext<"/icons/[size]">) {
  const { size: raw } = await params;
  const size = Number(raw);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  // Same rule as the favicon: the MeetChat mark on the shared domain, the brand's on its own domain.
  const current = await getCurrentBrand();
  const { theme } = hasRealDomain(current) ? current : PLATFORM;
  const dot = size * (12 / 64);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: size * (2 / 64),
        background: theme.primary,
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: dot,
            height: dot,
            borderRadius: dot,
            background: readableOn(theme.primary, theme),
          }}
        />
      ))}
    </div>,
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
