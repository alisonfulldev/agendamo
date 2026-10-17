import { NICHES } from "@/brands";
import { publishedArticles } from "@/content/articles";
import { NICHE_LANDINGS, type LandingCopy } from "@/content/copy/landing";
import { INTENT_PAGES } from "@/content/intent-pages";
import { nicheHomeContent } from "@/content/niche-pages";
import {
  getPublishedGuide,
  publishedTopics,
  type NicheTopicPage,
  type TopicEntry,
} from "@/content/niche-guides";

/**
 * Quality gate of the programmatic pages (Fase 3). Pages of the same template are compared by
 * word shingles (Jaccard): above `maxSimilarity` with any sibling, or with fewer than
 * `minUniqueBlocks` blocks of their own, a page is noindex and out of the sitemap, and the gate
 * test (npm run seo:gate, also before every build) fails.
 */
export const QUALITY_CONFIG = {
  /** Highest share of shingles a page may have in common with a page of the same template. */
  maxSimilarity: 0.7,
  /** Lowest number of blocks with the page's own content (answer, sections, FAQ). */
  minUniqueBlocks: 4,
  /** Words per shingle. */
  shingleSize: 5,
};

export interface QualityResult {
  path: string;
  template: string;
  blocks: number;
  /** Highest similarity with another page of the same template (0–1). */
  similarity: number;
  closest: string | null;
  passes: boolean;
  reasons: string[];
}

function words(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function shingles(text: string, size = QUALITY_CONFIG.shingleSize): Set<string> {
  const list = words(text);
  const set = new Set<string>();
  if (list.length < size) {
    if (list.length) set.add(list.join(" "));
    return set;
  }
  for (let i = 0; i <= list.length - size; i++) set.add(list.slice(i, i + size).join(" "));
  return set;
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let common = 0;
  for (const item of a) if (b.has(item)) common++;
  return common / (a.size + b.size - common);
}

type GuideLike = Pick<NicheTopicPage, "h1" | "answer" | "sections" | "faq">;

/** All the text a guide page shows. */
export function topicText(page: GuideLike): string {
  return [
    page.h1,
    page.answer,
    ...page.sections.flatMap((s) => [s.title, ...(s.paragraphs ?? []), ...(s.list ?? [])]),
    ...(page.faq ?? []).flatMap((f) => [f.question, f.answer]),
  ].join("\n");
}

/** Blocks with the page's own content: the answer, each section and the FAQ. */
export function topicBlocks(page: GuideLike): number {
  return 1 + page.sections.length + (page.faq?.length ? 1 : 0);
}

/** All the text a niche hub shows (shared template text included: it counts for similarity). */
function hubText(brandKey: string): string {
  const brand = NICHES.find((b) => b.key === brandKey)!;
  const c = nicheHomeContent(brand);
  const landing = NICHE_LANDINGS[brandKey];
  if (landing)
    return [landingText(landing), ...c.faq.items.flatMap((f) => [f.question, f.answer])].join("\n");
  const guide = getPublishedGuide(brandKey);
  return [
    c.hero.title,
    c.hero.subtitle,
    ...c.hero.points,
    c.steps.title,
    ...c.steps.items,
    c.intro?.title ?? "",
    ...(c.intro?.paragraphs ?? []),
    c.gains.title,
    ...c.gains.items.map((i) => i.text),
    c.reminders.title,
    c.reminders.text,
    ...c.faq.items.flatMap((f) => [f.question, f.answer]),
    c.closing.title,
    guide?.notes?.title ?? "",
    ...(guide?.notes?.items ?? []),
  ].join("\n");
}

/** All the text of a redesigned landing page (src/content/copy/landing.ts). */
export function landingText(copy: LandingCopy): string {
  return [
    copy.hero.title,
    copy.hero.subtitle,
    ...(copy.doors?.items.flatMap((d) => [d.pain, d.answer]) ?? []),
    copy.pains?.title ?? "",
    ...(copy.pains?.items.flatMap((p) => [p.scene, p.relief]) ?? []),
    copy.story.title,
    ...copy.story.rows.flatMap((r) => [r.kicker, r.title, r.text]),
    copy.compare.title,
    ...copy.compare.rows.flatMap((r) => [r.label, r.before, r.after]),
    copy.objections.title,
    ...copy.objections.items.flatMap((o) => [o.question, o.answer]),
    copy.closing.title,
    copy.closing.subtitle,
  ].join("\n");
}

function compare(
  pages: { path: string; template: string; text: string; blocks: number; minBlocks: number }[],
): QualityResult[] {
  const sets = pages.map((p) => shingles(p.text));
  return pages.map((page, i) => {
    let similarity = 0;
    let closest: string | null = null;
    pages.forEach((other, j) => {
      if (i === j || other.template !== page.template) return;
      const value = jaccard(sets[i]!, sets[j]!);
      if (value > similarity) {
        similarity = value;
        closest = other.path;
      }
    });
    const reasons: string[] = [];
    if (similarity > QUALITY_CONFIG.maxSimilarity) {
      reasons.push(`${Math.round(similarity * 100)}% igual a ${closest}`);
    }
    if (page.blocks < page.minBlocks) {
      reasons.push(`${page.blocks} blocos próprios (mínimo ${page.minBlocks})`);
    }
    return {
      path: page.path,
      template: page.template,
      blocks: page.blocks,
      similarity,
      closest,
      passes: reasons.length === 0,
      reasons,
    };
  });
}

let cached: QualityResult[] | null = null;

/**
 * The gate over every niche hub and every published subpage. Hubs are compared among themselves
 * (template "hub"); subpages with the same topic in other niches (template "tema:<topic>").
 */
export function qualityReport(): QualityResult[] {
  if (cached) return cached;
  const topics: TopicEntry[] = publishedTopics();
  cached = compare([
    ...NICHES.map((brand) => ({
      path: `/${brand.niche!.route}`,
      template: "hub",
      text: hubText(brand.key),
      // Hubs share the sales page structure; their own blocks are judged by similarity only.
      blocks: 0,
      minBlocks: 0,
    })),
    ...topics.map((t) => ({
      path: t.path,
      template: `tema:${t.topic}`,
      text: topicText(t.page),
      blocks: topicBlocks(t.page),
      minBlocks: QUALITY_CONFIG.minUniqueBlocks,
    })),
    ...publishedArticles().map((a) => ({
      path: `/${a.section}/${a.slug}`,
      template: a.section,
      text: topicText({ h1: a.h1, answer: a.summary, sections: a.sections, faq: a.faq }),
      blocks: topicBlocks({ h1: a.h1, answer: a.summary, sections: a.sections, faq: a.faq }),
      minBlocks: QUALITY_CONFIG.minUniqueBlocks,
    })),
    ...INTENT_PAGES.map((page) => ({
      path: `/agendamento/${page.slug}`,
      template: "agendamento",
      text: topicText(page),
      blocks: topicBlocks(page),
      minBlocks: QUALITY_CONFIG.minUniqueBlocks,
    })),
  ]);
  return cached;
}

/** Whether a programmatic page may be indexed (and listed in the sitemap). */
export function passesQualityGate(path: string): boolean {
  return qualityReport().find((r) => r.path === path)?.passes ?? true;
}
