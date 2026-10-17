/**
 * Data model of the niche SEO pages (Fase 3): the hub's extra blocks and the long-tail subpages
 * (/{nicho}/{tema}). Services, vocabulary (cliente/paciente…) and theme come from the niche's
 * brand file (src/brands), never repeated here. Every block is optional and renders only with
 * data; the quality gate (src/lib/seo/quality.ts) decides what may be indexed.
 */

/** Long-tail subpages. Only the ones with their own content exist for a niche. */
export const NICHE_TOPICS = [
  "reduzir-faltas",
  "agendar-pelo-whatsapp",
  "agendar-pelo-instagram",
] as const;
export type NicheTopic = (typeof NICHE_TOPICS)[number];

/** Short label of each subpage (links, breadcrumb). Varies by niche through `linkLabel`. */
export const TOPIC_LABELS: Record<NicheTopic, string> = {
  "reduzir-faltas": "Como reduzir faltas",
  "agendar-pelo-whatsapp": "Agendamento pelo WhatsApp",
  "agendar-pelo-instagram": "Agendamento pelo Instagram",
};

export interface GuideSection {
  title: string;
  paragraphs?: string[];
  /** Steps or points, rendered as a list. */
  list?: string[];
  /** Ordered list (steps). */
  ordered?: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface NicheTopicPage {
  /** <title> (≤ 65 characters). */
  title: string;
  /** Meta description (70–160 characters). */
  description: string;
  h1: string;
  /** Direct answer in the first lines (search and AI answers). */
  answer: string;
  sections: GuideSection[];
  faq?: FaqItem[];
  /** Anchor used when other pages link here (varied, not always the label). */
  linkLabel?: string;
  /** Last change of this page's text (YYYY-MM-DD). */
  updatedAt: string;
}

export interface NicheGuide {
  /** Brand key (src/brands). */
  brandKey: string;
  /** Wave flag: false keeps the subpages and the hub's extra blocks off (404, out of sitemap). */
  published: boolean;
  /** Health topic: notice on the pages and specialist review before publishing more. */
  ymyl: boolean;
  /** How people search for the niche (research and the AI prompt list; not rendered as is). */
  searchTerms: { singular: string; plural: string; synonyms: string[] };
  /** Hub block: what is particular about scheduling in this niche. */
  notes?: { title: string; items: string[] };
  /** Niches with real affinity (brand keys), for the related block. */
  related: string[];
  /** Notice shown on health pages. */
  disclaimer?: string;
  topics: Partial<Record<NicheTopic, NicheTopicPage>>;
}
