import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { NICHES } from "@/brands";
import { publishedArticles } from "@/content/articles";
import { COMPARISONS } from "@/content/comparisons";
import { HOME_LANDING, NICHE_LANDINGS } from "@/content/copy/landing";
import { HOME } from "@/content/home";
import { INTENT_PAGES } from "@/content/intent-pages";
import { NICHE_GUIDES } from "@/content/niche-guides";
import { nicheHomeContent } from "@/content/niche-pages";
import { PRICING } from "@/content/pricing";
import { TOOLS } from "@/content/tools";
import { EXPERIMENTS } from "@/lib/experiments";

/**
 * Copy lint (CI): every published text of the marketing site against the voice rules
 * (docs/design/direction.md, content/banned-phrases.txt). Fails on clichés, unproven
 * superlatives, numbers without a source, duplicated headlines, TODO in published text and
 * health pages without a review status.
 */
const BANNED = readFileSync(path.join(process.cwd(), "content", "banned-phrases.txt"), "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim().toLowerCase())
  .filter((line) => line && !line.startsWith("#"));

/** Every string inside a value (objects, arrays), with where it came from. */
function strings(value: unknown, where: string): { where: string; text: string }[] {
  if (typeof value === "string") return [{ where, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${where}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => strings(v, `${where}.${k}`));
  }
  return [];
}

/** Keys that are data, not visible copy (links, slugs, mock handles). */
const NOT_COPY =
  /\.(href|slug|handle|url|path|route|brandKey|updatedAt|datePublished|dateModified|verifiedAt|kind|competitor|niche|visual|review|status|section|related\[\d+\]|source)$/;

const pages: { page: string; value: unknown }[] = [
  { page: "home", value: { landing: HOME_LANDING, meta: HOME.meta, faq: HOME.faq } },
  { page: "precos", value: PRICING },
  ...Object.entries(NICHE_LANDINGS).map(([key, value]) => ({ page: `landing:${key}`, value })),
  ...NICHES.map((brand) => ({
    page: `nicho:${brand.key}`,
    value: { meta: nicheHomeContent(brand).meta, faq: nicheHomeContent(brand).faq },
  })),
  ...NICHE_GUIDES.filter((g) => g.published).map((g) => ({ page: `guia:${g.brandKey}`, value: g })),
  ...INTENT_PAGES.map((p) => ({ page: `agendamento:${p.slug}`, value: p })),
  ...TOOLS.map((t) => ({ page: `ferramenta:${t.slug}`, value: t })),
  ...COMPARISONS.filter((c) => c.published).map((c) => ({ page: `comparar:${c.slug}`, value: c })),
  ...publishedArticles().map((a) => ({ page: `${a.section}:${a.slug}`, value: a })),
  ...EXPERIMENTS.map((e) => ({ page: `experimento:${e.id}`, value: e.variants })),
];

const texts = pages.flatMap(({ page, value }) =>
  strings(value, page).filter(({ where }) => !NOT_COPY.test(where)),
);

describe("copy lint", () => {
  it("has copy to check", () => {
    expect(texts.length).toBeGreaterThan(500);
  });

  it("uses no banned phrase (clichés, superlatives, false urgency, result promises)", () => {
    const found = texts.flatMap(({ where, text }) =>
      BANNED.filter((phrase) => text.toLowerCase().includes(phrase)).map(
        (phrase) => `${where}: "${phrase}" em "${text.slice(0, 80)}"`,
      ),
    );
    expect(found).toEqual([]);
  });

  it("states no percentage or big number without a source", () => {
    // Allowed: durations, times, prices from the config, the trial days and Instagram's limit.
    const stat = /\b\d+(?:[.,]\d+)?\s?%|\b\d{1,3}(?:\.\d{3})+\b|\b\d+\s?mil\b/i;
    const found = texts
      .filter(({ text }) => stat.test(text))
      .map(({ where, text }) => `${where}: "${text.slice(0, 100)}"`);
    expect(found).toEqual([]);
  });

  it("publishes no TODO", () => {
    const found = texts.filter(({ text }) => /TODO/.test(text)).map(({ where }) => where);
    expect(found).toEqual([]);
  });

  it("never repeats a headline, a closing or a pain scene between pages", () => {
    const landings = [HOME_LANDING, ...Object.values(NICHE_LANDINGS)];
    for (const pick of [
      (l: (typeof landings)[number]) => [l.hero.title],
      (l: (typeof landings)[number]) => [l.hero.subtitle],
      (l: (typeof landings)[number]) => [l.closing.title],
      (l: (typeof landings)[number]) => l.pains?.items.map((p) => p.scene) ?? [],
      (l: (typeof landings)[number]) => l.story.rows.map((r) => r.title),
    ]) {
      const all = landings.flatMap(pick);
      expect(all.length - new Set(all).size, JSON.stringify(all)).toBe(0);
    }
  });

  it("each niche CTA names the niche (no generic “Enviar”)", () => {
    for (const [key, landing] of Object.entries(NICHE_LANDINGS)) {
      expect(landing.hero.cta, key).toMatch(/^Criar meu link/);
      expect(landing.hero.cta, key).not.toBe(HOME_LANDING.hero.cta);
    }
  });

  it("health pages carry their notice and an explicit review status", () => {
    const health = NICHES.filter((b) => b.terms.customer.singular === "paciente").map((b) => b.key);
    const pending: string[] = [];
    for (const key of health) {
      const landing = NICHE_LANDINGS[key];
      if (landing) {
        expect(landing.ymyl?.notice, key).toBeTruthy();
        expect(["pendente", "aprovada"], key).toContain(landing.ymyl?.review);
        if (landing.ymyl?.review === "pendente") pending.push(`landing:${key}`);
      }
      const guide = NICHE_GUIDES.find((g) => g.brandKey === key && g.published);
      if (guide) {
        expect(guide.ymyl, key).toBe(true);
        expect(guide.disclaimer, key).toBeTruthy();
      }
    }
    if (pending.length) console.log(`Revisão especialista pendente: ${pending.join(", ")}`);
  });
});
