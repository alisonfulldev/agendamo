import { ImageResponse } from "next/og";

import { getCurrentBrand } from "@/brands/server";
import { readableOn } from "@/brands/theme";

/** Open Graph image of the brand's sales page (1200×630). */
export async function GET() {
  const brand = await getCurrentBrand();
  const { theme } = brand;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        background: theme.background,
        color: theme.text,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ fontSize: 36, fontWeight: 700, color: theme.primary }}>{brand.name}</div>
      <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1, marginTop: 24 }}>
        {brand.sales.title}
      </div>
      <div style={{ fontSize: 30, marginTop: 24, color: theme.muted }}>{brand.sales.subtitle}</div>
      <div
        style={{
          display: "flex",
          marginTop: 40,
          alignSelf: "flex-start",
          background: theme.button,
          color: readableOn(theme.button, theme),
          fontSize: 30,
          fontWeight: 700,
          padding: "16px 32px",
          borderRadius: 16,
        }}
      >
        Crie sua página grátis
      </div>
    </div>,
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
