import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { BRANDS } from "@/brands";

// CLAUDE.md rule 14: no literal colors outside brand files. Colors come from CSS variables of the theme.
const SRC = path.join(process.cwd(), "src");
const ALLOWED = new Set([
  ...BRANDS.map((brand) => path.join(SRC, "brands", `${brand.key}.ts`)),
  // The Agendamo product config (generic home) is a brand file too.
  path.join(SRC, "brands", "platform.ts"),
]);

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const UTILITIES =
  "bg|text|border|ring|fill|stroke|from|via|to|outline|decoration|shadow|accent|caret|divide|placeholder";

const FORBIDDEN: [string, RegExp][] = [
  ["hex color", /#[0-9a-fA-F]{3,8}\b/],
  ["color function", /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/],
  ["Tailwind palette class", new RegExp(`\\b(?:${UTILITIES})-(?:${PALETTE})-\\d{2,3}\\b`)],
  ["Tailwind black/white class", new RegExp(`\\b(?:${UTILITIES})-(?:black|white)\\b`)],
];

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

const files = listFiles(SRC).filter(
  (file) => /\.(tsx?|css)$/.test(file) && !/\.test\.tsx?$/.test(file) && !ALLOWED.has(file),
);

describe("no hardcoded colors in src/", () => {
  it.each(files.map((file) => [path.relative(process.cwd(), file), file]))("%s", (_name, file) => {
    const problems = readFileSync(file, "utf8")
      .split("\n")
      .flatMap((line, index) =>
        FORBIDDEN.filter(([, pattern]) => pattern.test(line)).map(
          ([label]) => `line ${index + 1} (${label}): ${line.trim()}`,
        ),
      );
    expect(problems).toEqual([]);
  });
});
