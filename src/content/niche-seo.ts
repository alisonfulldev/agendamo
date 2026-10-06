/**
 * SEO texts of each niche page (long tail): title, description, H1 and unique paragraphs and
 * questions, so each page reads as made for that niche. Anything left out falls back to the
 * niche's brand file (src/content/niche-pages.ts).
 */
export interface NicheSeo {
  /** <title>: main search of the niche first. */
  title?: string;
  /** Meta description (up to ~155 characters). */
  description?: string;
  h1?: string;
  subtitle?: string;
  painsTitle?: string;
  intro?: { title: string; paragraphs: string[] };
  /** Niche questions (long tail), shown before the shared ones. */
  faq?: { question: string; answer: string }[];
  /** Extra examples for the animated phone. */
  demo?: { business: string; customer: string; service: string; times: string[] }[];
}

/** Filled niche by niche (beauty and health first, then the others). */
export const NICHE_SEO: Record<string, NicheSeo> = {};
