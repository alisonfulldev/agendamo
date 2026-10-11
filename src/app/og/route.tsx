import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { getBrand, PLATFORM } from "@/brands";
import { readableOn } from "@/brands/theme";
import { HOME_DEMO, heroDemoFor } from "@/content/hero-demo";
import { HOME } from "@/content/home";
import { nicheHomeContent } from "@/content/niche-pages";
import { PRICE_TEXT } from "@/lib/plans";

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
  const demo = niche?.niche ? heroDemoFor(niche) : HOME_DEMO;
  const onPrimary = readableOn(theme.primary, theme);
  const bubble = (text: string, mine: boolean) => (
    <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
      <div
        style={{
          display: "flex",
          maxWidth: 230,
          padding: "10px 14px",
          borderRadius: 18,
          fontSize: 18,
          lineHeight: 1.25,
          background: mine ? theme.primary : theme.surface,
          color: mine ? onPrimary : theme.text,
        }}
      >
        {text}
      </div>
    </div>
  );
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 56,
        padding: "0 72px",
        background: theme.background,
        color: theme.text,
        fontFamily: "Poppins",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: theme.primary }}>
          {niche?.niche ? `MeetChat · ${niche.niche.name}` : "MeetChat"}
        </div>
        <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, marginTop: 18 }}>
          {content.hero.title}
        </div>
        <div style={{ fontSize: 26, marginTop: 18, color: theme.muted }}>
          {PRICE_TEXT.heroNote}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 32,
            alignSelf: "flex-start",
            background: theme.button,
            color: readableOn(theme.button, theme),
            fontSize: 26,
            fontWeight: 800,
            padding: "14px 28px",
            borderRadius: 16,
          }}
        >
          Criar meu link grátis
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 330,
          height: 540,
          borderRadius: 44,
          border: `12px solid ${theme.text}`,
          background: theme.background,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "26px 18px 14px",
            background: theme.primary,
            color: onPrimary,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800 }}>{demo.business}</div>
          <div style={{ fontSize: 15 }}>Agendamento 24h</div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: 10,
            flex: 1,
            padding: 16,
          }}
        >
          {bubble("Olá! Qual serviço você quer agendar?", false)}
          {bubble(demo.service, true)}
          {bubble("Qual dia fica melhor?", false)}
          {bubble("Sábado, 10h", true)}
          {bubble("Pronto! Horário confirmado para sábado às 10h.", false)}
        </div>
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
