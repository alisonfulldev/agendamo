import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { getBrand, PLATFORM } from "@/brands";
import { readableOn } from "@/brands/theme";
import { HOME } from "@/content/home";
import { nicheHomeContent } from "@/content/niche-pages";

const FONT_DIR = join(process.cwd(), "assets/fonts");
const FONTS = Promise.all(
  (
    [
      ["Poppins-Regular.ttf", 400],
      ["Poppins-ExtraBold.ttf", 800],
    ] as const
  ).map(async ([file, weight]) => ({
    name: "Poppins",
    data: await readFile(join(FONT_DIR, file)),
    weight,
    style: "normal" as const,
  })),
);

/** Share image (1200×630) of the home or of a niche page (?nicho=<key>). */
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("nicho");
  const niche = getBrand(key);
  const brand = niche?.niche ? niche : PLATFORM;
  const content = niche?.niche ? nicheHomeContent(niche) : HOME;
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
        fontFamily: "Poppins",
      }}
    >
      <div style={{ fontSize: 36, fontWeight: 800, color: theme.primary }}>
        {niche?.niche ? `MeetChat · ${niche.niche.name}` : "MeetChat"}
      </div>
      <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1, marginTop: 24 }}>
        {content.hero.title}
      </div>
      <div style={{ fontSize: 28, marginTop: 24, color: theme.muted }}>
        Agendamento por chat inteligente · 24 horas por dia
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 40,
          alignSelf: "flex-start",
          background: theme.button,
          color: readableOn(theme.button, theme),
          fontSize: 30,
          fontWeight: 800,
          padding: "16px 32px",
          borderRadius: 16,
        }}
      >
        Crie seu link grátis
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: await FONTS,
      headers: { "Cache-Control": "public, max-age=86400" },
    },
  );
}
