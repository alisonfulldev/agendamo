import { describe, expect, it } from "vitest";

import { NICHES } from "@/brands";
import { HOME } from "@/content/home";
import { ARTICLE_SECTIONS, publishedArticles } from "@/content/articles";
import { COMPARISONS, COMPARISONS_INDEX } from "@/content/comparisons";
import { INTENT_INDEX, INTENT_PAGES } from "@/content/intent-pages";
import { publishedTopics } from "@/content/niche-guides";
import { TOOLS, TOOLS_INDEX } from "@/content/tools";
import { nicheHomeContent } from "@/content/niche-pages";
import { PRICING } from "@/content/pricing";

const pages = [
  { path: "/", ...HOME.meta },
  { path: "/precos", ...PRICING.meta },
  ...NICHES.map((brand) => ({ path: `/${brand.niche!.route}`, ...nicheHomeContent(brand).meta })),
  { path: "/agendamento", ...INTENT_INDEX },
  ...INTENT_PAGES.map((p) => ({ path: `/agendamento/${p.slug}`, ...p })),
  { path: "/ferramentas", ...TOOLS_INDEX },
  ...TOOLS.map((t) => ({ path: `/ferramentas/${t.slug}`, ...t })),
  { path: "/comparar", ...COMPARISONS_INDEX },
  ...COMPARISONS.filter((c) => c.published).map((c) => ({ path: `/comparar/${c.slug}`, ...c })),
  { path: "/recursos", ...ARTICLE_SECTIONS.recursos },
  { path: "/ajuda", ...ARTICLE_SECTIONS.ajuda },
  ...publishedArticles().map((a) => ({ path: `/${a.section}/${a.slug}`, ...a })),
  ...publishedTopics().map((t) => ({
    path: t.path,
    title: t.page.title,
    description: t.page.description,
  })),
];

describe("marketing pages metadata", () => {
  it("every title and description is unique", () => {
    expect(new Set(pages.map((p) => p.title)).size).toBe(pages.length);
    expect(new Set(pages.map((p) => p.description)).size).toBe(pages.length);
  });

  it.each(pages)("$path fits search results", ({ title, description }) => {
    expect(title.length).toBeLessThanOrEqual(65);
    expect(description.length).toBeGreaterThanOrEqual(70);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it("never promises a trial without a deadline or free forever", () => {
    for (const { title, description } of pages) {
      expect(`${title} ${description}`).not.toMatch(/teste grátis(?! de \d+ dias)|para sempre/i);
    }
  });
});
