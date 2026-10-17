/**
 * Contextual links (Fase 6): mentions of a topic in a guide's paragraphs become links to the page
 * about it ("lembrete automático" → /agendamento/lembrete-automatico). The anchor is the text as
 * written, so anchors vary naturally. Per page: one link per target, never to the page itself and
 * at most `max` links in total.
 */
export interface EntityLink {
  href: string;
  /** First match wins; matched case-insensitively on word boundaries. */
  patterns: RegExp[];
}

export const ENTITY_LINKS: readonly EntityLink[] = [
  {
    href: "/agendamento/lembrete-automatico",
    patterns: [/lembretes? automáticos?/i, /lembrete por e-mail/i],
  },
  { href: "/agendamento/link-na-bio", patterns: [/link (?:na|da) bio/i] },
  { href: "/agendamento/reduzir-faltas", patterns: [/reduzir (?:as )?faltas/i, /no-show/i] },
  { href: "/agendamento/sem-app", patterns: [/sem (?:baixar )?(?:aplicativo|app)\b/i] },
  { href: "/agendamento/multiagenda", patterns: [/(?:própria|sua) agenda e (?:os )?serviços/i] },
  { href: "/agendamento/pelo-whatsapp", patterns: [/WhatsApp Business/i] },
  { href: "/agendamento/agenda-gratis", patterns: [/modo WhatsApp/i] },
  { href: "/ferramentas/calculadora-de-faltas", patterns: [/calculadora de prejuízo com faltas/i] },
  { href: "/ferramentas/mensagens-whatsapp", patterns: [/mensagens? de confirmação/i] },
  { href: "/precos", patterns: [/plano pago/i] },
];

export type LinkedPart = string | { text: string; href: string };

export interface EntityLinker {
  /** Splits a paragraph into text and links, consuming the page's budget. */
  link(text: string): LinkedPart[];
}

export function createEntityLinker({
  currentPath,
  max = 3,
  entities = ENTITY_LINKS,
}: {
  currentPath: string;
  max?: number;
  entities?: readonly EntityLink[];
}): EntityLinker {
  const used = new Set<string>([currentPath]);
  let budget = max;

  return {
    link(text) {
      if (budget <= 0) return [text];
      // Earliest match among the targets not used yet.
      let best: { index: number; length: number; href: string } | null = null;
      for (const entity of entities) {
        if (used.has(entity.href)) continue;
        for (const pattern of entity.patterns) {
          const match = new RegExp(
            `(?<![\\p{L}\\d])(?:${pattern.source})(?![\\p{L}\\d])`,
            "iu",
          ).exec(text);
          if (match && (!best || match.index < best.index)) {
            best = { index: match.index, length: match[0].length, href: entity.href };
          }
        }
      }
      if (!best) return [text];
      used.add(best.href);
      budget -= 1;
      const before = text.slice(0, best.index);
      const anchor = text.slice(best.index, best.index + best.length);
      const after = text.slice(best.index + best.length);
      return [
        ...(before ? [before] : []),
        { text: anchor, href: best.href },
        ...(after ? this.link(after) : []),
      ];
    },
  };
}
