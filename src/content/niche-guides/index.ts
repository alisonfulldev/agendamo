import { getBrand, type BrandConfig } from "@/brands";

import { aestheticsGuide } from "./aesthetics";
import { barberGuide } from "./barber";
import { beautyGuide } from "./beauty";
import { nailsGuide } from "./nails";
import { psychologyGuide } from "./psychology";
import { NICHE_TOPICS, type NicheGuide, type NicheTopic, type NicheTopicPage } from "./types";

export * from "./types";

/**
 * Niche guides (Fase 3). Pilots: beleza, barbearia, manicure, psicologia, estética. To add a
 * niche: write its file here (types.ts), create src/app/<route>/[tema]/page.tsx and turn
 * `published` on when the quality gate passes (docs/seo/playbook.md).
 */
export const NICHE_GUIDES: readonly NicheGuide[] = [
  beautyGuide,
  barberGuide,
  nailsGuide,
  psychologyGuide,
  aestheticsGuide,
];

const byKey = new Map(NICHE_GUIDES.map((g) => [g.brandKey, g]));

/** The niche's guide when its wave is published. */
export function getPublishedGuide(brandKey: string): NicheGuide | null {
  const guide = byKey.get(brandKey);
  return guide?.published ? guide : null;
}

export interface TopicEntry {
  brand: BrandConfig;
  guide: NicheGuide;
  topic: NicheTopic;
  page: NicheTopicPage;
  /** "/barbearia/reduzir-faltas". */
  path: string;
}

/** Every subpage of the published niches. */
export function publishedTopics(): TopicEntry[] {
  return NICHE_GUIDES.filter((g) => g.published).flatMap((guide) => {
    const brand = getBrand(guide.brandKey);
    if (!brand?.niche) return [];
    return NICHE_TOPICS.flatMap((topic) => {
      const page = guide.topics[topic];
      return page ? [{ brand, guide, topic, page, path: `/${brand.niche!.route}/${topic}` }] : [];
    });
  });
}

/** One subpage, or null (unknown topic, niche off, no content). */
export function getTopic(brandKey: string, topic: string): TopicEntry | null {
  return publishedTopics().find((t) => t.brand.key === brandKey && t.topic === topic) ?? null;
}
