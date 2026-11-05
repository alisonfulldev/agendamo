import { z } from "zod";

/**
 * Briefing of the custom site (2026-11-06): simple questions on the phone. Used by the form (panel)
 * and validated on the server. Photos are R2 keys added by the upload pipeline (kind "briefing").
 */

export const BRIEFING_STYLES = [
  "Elegante",
  "Moderno",
  "Delicado",
  "Divertido",
  "Sério",
  "Natural",
  "Luxuoso",
  "Minimalista",
] as const;

export const BRIEFING_HIGHLIGHTS = [
  "Serviços e preços",
  "Antes e depois",
  "Equipe",
  "O espaço",
  "Depoimentos",
  "Promoções",
  "Sobre mim",
  "Perguntas frequentes",
] as const;

export const BRIEFING_MAX_PHOTOS = 12;

const text = (max: number) => z.string().trim().max(max).default("");

export const briefingSchema = z.object({
  styles: z.array(z.enum(BRIEFING_STYLES)).max(BRIEFING_STYLES.length).default([]),
  colors: text(200),
  references: z.array(z.string().trim().max(300)).max(3).default([]),
  highlights: z.array(z.enum(BRIEFING_HIGHLIGHTS)).max(BRIEFING_HIGHLIGHTS.length).default([]),
  headline: text(120),
  about: text(1500),
  differentials: text(1000),
  audience: text(500),
  notes: text(1500),
  photos: z.array(z.string().max(300)).max(BRIEFING_MAX_PHOTOS).default([]),
});

export type Briefing = z.infer<typeof briefingSchema>;

/** What must be answered before sending (the rest is optional). */
export function briefingMissing(b: Briefing): string[] {
  return [
    ...(b.styles.length ? [] : ["o estilo do site"]),
    ...(b.highlights.length ? [] : ["o que destacar"]),
    ...(b.about.length >= 20 ? [] : ["um pouco sobre você ou o negócio"]),
  ];
}

/** The briefing as text, to paste in the chat with whoever builds the site. */
export function briefingText(
  b: Briefing,
  info: { business: string; niche: string; city: string | null; site: string; photoUrls: string[] },
): string {
  const line = (label: string, value: string) => (value ? `${label}: ${value}` : null);
  return [
    `SITE PERSONALIZADO: ${info.business} (${info.niche}${info.city ? `, ${info.city}` : ""})`,
    `Site atual: ${info.site}`,
    line("Estilo", b.styles.join(", ")),
    line("Cores", b.colors),
    line("Referências", b.references.filter(Boolean).join(" · ")),
    line("Destacar", b.highlights.join(", ")),
    line("Frase principal", b.headline),
    line("Sobre", b.about),
    line("Diferenciais", b.differentials),
    line("Público", b.audience),
    line("Observações", b.notes),
    info.photoUrls.length ? `Fotos:\n${info.photoUrls.join("\n")}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}
