import type { SiteSettings } from "@/lib/db/types";

/**
 * Texts of a "Site ou Loja" site (2026-11-07): the owner's own, or these defaults when a field is
 * left empty. Shared by the public site and the editor (its placeholders).
 */
export interface WebTexts {
  title: string;
  subtitle: string;
  cta: string;
  /** The message that opens in the owner's WhatsApp from the site's buttons. */
  message: string;
}

export function webDefaults(input: {
  name: string;
  bio: string | null;
  city: string | null;
  store: boolean;
}): WebTexts {
  const firstSentence = input.bio?.split(/(?<=[.!?])\s/)[0]?.trim();
  const city = input.city ? ` em ${input.city}` : "";
  return {
    title: input.name,
    subtitle:
      firstSentence && firstSentence.length >= 20 && firstSentence.length <= 200
        ? firstSentence
        : input.store
          ? `Escolha seus produtos e faça o pedido direto pelo WhatsApp${city}.`
          : `Atendimento rápido e direto pelo WhatsApp${city}. Fale com a gente.`,
    cta: input.store ? "Ver produtos" : "Falar no WhatsApp",
    message: input.store
      ? `Olá! Vi a loja ${input.name} e quero fazer um pedido.`
      : `Olá! Vi o site de ${input.name} e gostaria de mais informações.`,
  };
}

/** The texts the site shows: the owner's edits over the defaults. */
export function webTexts(
  defaults: WebTexts,
  settings: Pick<
    SiteSettings,
    "hero_title" | "hero_subtitle" | "cta_label" | "whatsapp_message"
  > | null,
): WebTexts {
  return {
    title: settings?.hero_title || defaults.title,
    subtitle: settings?.hero_subtitle || defaults.subtitle,
    cta: settings?.cta_label || defaults.cta,
    message: settings?.whatsapp_message || defaults.message,
  };
}

/** wa.me link to the owner's WhatsApp with a ready message (opened by the visitor). */
export function whatsappHref(phone: string | null | undefined, message: string): string | null {
  const digits = phone?.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
