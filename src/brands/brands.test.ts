import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { BRANDS, DEFAULT_BRAND, getNiche, NICHES, parseBrands, PLATFORM } from "@/brands";

/** Every theme on the site: the niches and the MeetChat product (generic home). */
const ALL = [...BRANDS, PLATFORM];
import { psychology } from "@/brands/psychology";
import { PRICE_TEXT } from "@/lib/plans";
import { contrastRatio, readableOn } from "@/brands/theme";

describe("brand configs", () => {
  it("all brands are valid and DEFAULT_BRAND exists", () => {
    expect(BRANDS.map((brand) => brand.key)).toEqual([
      "beauty",
      "barber",
      "aesthetics",
      "nails",
      "lash-brow",
      "tattoo",
      "psychology",
      "psychoanalysis",
      "physio",
      "nutrition",
      "speech-therapy",
      "occupational-therapy",
      "psychopedagogy",
      "dentistry",
      "medical",
      "podiatry",
      "chiropractic",
      "osteopathy",
      "acupuncture",
      "massage-therapy",
      "integrative-therapy",
      "pilates",
      "yoga",
      "personal-trainer",
      "pet-grooming",
      "veterinary",
      "tutoring",
      "photography",
      "consulting",
      "auto-detailing",
      "sports-court",
      "general",
    ]);
    expect(DEFAULT_BRAND.key).toBe("beauty");
  });

  // Prompt 39: every theme passes WCAG AA for normal text.
  it.each(ALL.map((brand) => [brand.key, brand] as const))(
    "%s: theme contrast is AA (4.5:1)",
    (_key, brand) => {
      const { theme } = brand;
      const pairs: [string, string, string][] = [
        ["text on background", theme.text, theme.background],
        ["text on surface", theme.text, theme.surface],
        ["muted on background", theme.muted, theme.background],
        ["muted on surface", theme.muted, theme.surface],
        ["button label", theme.button, readableOn(theme.button, theme)],
        ["primary label", theme.primary, readableOn(theme.primary, theme)],
        ["accent label", theme.accent, readableOn(theme.accent, theme)],
      ];
      for (const [label, a, b] of pairs) {
        expect(contrastRatio(a, b), `${brand.key}: ${label}`).toBeGreaterThanOrEqual(4.5);
      }
    },
  );

  it.each(ALL.map((brand) => [brand.key, brand] as const))(
    "%s: logo and favicon exist in public/",
    (_key, brand) => {
      for (const asset of [brand.logo, brand.favicon]) {
        expect(existsSync(path.join(process.cwd(), "public", asset))).toBe(true);
      }
    },
  );

  it.each(BRANDS.map((brand) => [brand.key, brand] as const))(
    "%s: text on primary and button is readable (contrast >= 3)",
    (_key, brand) => {
      const { theme } = brand;
      expect(contrastRatio(theme.primary, readableOn(theme.primary, theme))).toBeGreaterThanOrEqual(
        3,
      );
      expect(contrastRatio(theme.button, readableOn(theme.button, theme))).toBeGreaterThanOrEqual(
        3,
      );
      expect(contrastRatio(theme.background, theme.text)).toBeGreaterThanOrEqual(4.5);
    },
  );
});

describe("parseBrands", () => {
  it("rejects duplicate keys", () => {
    expect(() => parseBrands([psychology, psychology])).toThrow(/Duplicate brand key/);
  });

  it("rejects a domain used by two brands", () => {
    const copy = { ...psychology, key: "psychology-copy" };
    expect(() => parseBrands([psychology, copy])).toThrow(/psicologia\.example\.com/);
  });

  it("rejects unknown chat variables", () => {
    const invalid = {
      ...psychology,
      chatMessages: { ...psychology.chatMessages, greeting: "Oi {nome}" },
    };
    expect(() => parseBrands([invalid])).toThrow(/chatMessages\.greeting/);
  });

  it("rejects invalid colors", () => {
    const invalid = { ...psychology, theme: { ...psychology.theme, primary: "pink" } };
    expect(() => parseBrands([invalid])).toThrow(/theme\.primary/);
  });

  it("every niche has its own page route and the product is named MeetChat", () => {
    expect(NICHES.map((brand) => brand.niche!.route)).toEqual([
      "beleza",
      "barbearia",
      "estetica",
      "manicure",
      "cilios-e-sobrancelhas",
      "tatuagem",
      "psicologia",
      "psicanalise",
      "fisioterapia",
      "nutricao",
      "fonoaudiologia",
      "terapia-ocupacional",
      "psicopedagogia",
      "odontologia",
      "consultorios",
      "podologia",
      "quiropraxia",
      "osteopatia",
      "acupuntura",
      "massoterapia",
      "terapias-integrativas",
      "pilates",
      "yoga",
      "personal",
      "banho-e-tosa",
      "veterinaria",
      "aulas",
      "fotografia",
      "consultoria",
      "estetica-automotiva",
      "quadras",
    ]);
    for (const brand of ALL) expect(brand.name).toBe("MeetChat");
    for (const brand of NICHES) {
      expect(existsSync(path.join(process.cwd(), "src/app", brand.niche!.route, "page.tsx"))).toBe(
        true,
      );
    }
    expect(BRANDS.map((b) => b.key)).not.toContain(PLATFORM.key);
  });
});

describe("niche copy", () => {
  it("FAQ prices always come from the price table", () => {
    for (const brand of [...BRANDS, PLATFORM]) {
      const answers = brand.sales.faq.map((item) => item.answer).join(" ");
      expect(answers, brand.key).toContain(PRICE_TEXT.noCard);
      expect(answers, brand.key).toContain(PRICE_TEXT.extraProfessional);
    }
  });

  it("no copy promises the old 30-day trial", () => {
    for (const brand of [...BRANDS, PLATFORM]) {
      expect(JSON.stringify(brand.sales), brand.key).not.toMatch(/30 dias grátis/);
    }
  });
});

describe("getNiche", () => {
  it("returns the business niche when it exists", () => {
    expect(getNiche("barber").key).toBe("barber");
    expect(getNiche("pet-grooming").key).toBe("pet-grooming");
  });

  it.each([null, undefined, "", "removed-niche", "BEAUTY", "agendamo"])(
    "falls back to “Outro / Geral” for %s",
    (key) => {
      const niche = getNiche(key);
      expect(niche.key).toBe("general");
      expect(niche.defaultSegment).toBe("general");
    },
  );

  it("“Outro / Geral” is neutral and has no page or card on the site", () => {
    const general = getNiche("general");
    expect(general.niche).toBeUndefined();
    expect(NICHES.map((b) => b.key)).not.toContain("general");
    expect(general.suggestedServices).toEqual([
      { name: "Primeiro atendimento", durationMinutes: 60 },
      { name: "Atendimento", durationMinutes: 45 },
      { name: "Retorno", durationMinutes: 30 },
    ]);
    expect(general.terms.customer.singular).toBe("cliente");
    expect(general.terms.service.singular).toBe("atendimento");
    expect(general.terms.appointment.singular).toBe("horário");
    expect(general.chatMessages.greeting).toContain("Qual atendimento você quer agendar?");
  });
});
