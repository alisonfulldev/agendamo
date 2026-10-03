import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { BRANDS, DEFAULT_BRAND, parseBrands } from "@/brands";
import { beauty } from "@/brands/beauty";
import { contrastRatio, readableOn } from "@/brands/theme";

describe("brand configs", () => {
  it("all brands are valid and DEFAULT_BRAND exists", () => {
    expect(BRANDS.map((brand) => brand.key)).toEqual([
      "beauty",
      "barber",
      "aesthetics",
      "psychology",
      "physio",
    ]);
    expect(DEFAULT_BRAND.key).toBe("beauty");
  });

  // Prompt 39: every theme passes WCAG AA for normal text.
  it.each(BRANDS.map((brand) => [brand.key, brand] as const))(
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

  it.each(BRANDS.map((brand) => [brand.key, brand] as const))(
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
    expect(() => parseBrands([beauty, beauty])).toThrow(/Duplicate brand key/);
  });

  it("rejects a domain used by two brands", () => {
    const copy = { ...beauty, key: "beauty-copy" };
    expect(() => parseBrands([beauty, copy])).toThrow(/beauty\.example\.com/);
  });

  it("rejects unknown chat variables", () => {
    const invalid = {
      ...beauty,
      chatMessages: { ...beauty.chatMessages, greeting: "Oi {nome}" },
    };
    expect(() => parseBrands([invalid])).toThrow(/chatMessages\.greeting/);
  });

  it("rejects invalid colors", () => {
    const invalid = { ...beauty, theme: { ...beauty.theme, primary: "pink" } };
    expect(() => parseBrands([invalid])).toThrow(/theme\.primary/);
  });
});
