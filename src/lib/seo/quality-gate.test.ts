import { describe, expect, it } from "vitest";

import { publishedTopics } from "@/content/niche-guides";

import { jaccard, QUALITY_CONFIG, qualityReport, shingles } from "./quality";

/**
 * Quality gate (npm run seo:gate; runs before every build). Prints the report and fails when a
 * published programmatic page is too similar to a sibling or too thin.
 */
describe("quality gate", () => {
  const report = qualityReport();

  it("prints the report", () => {
    const rows = report.map(
      (r) =>
        `${r.passes ? "ok " : "NÃO"} ${r.path.padEnd(42)} ${String(Math.round(r.similarity * 100)).padStart(3)}% ${r.closest ?? ""}${r.reasons.length ? `  → ${r.reasons.join("; ")}` : ""}`,
    );
    console.log(
      `Portão de qualidade (máx. ${QUALITY_CONFIG.maxSimilarity * 100}% de semelhança, mín. ${QUALITY_CONFIG.minUniqueBlocks} blocos)\n${rows.join("\n")}`,
    );
    expect(report.length).toBeGreaterThan(0);
  });

  it.each([
    ...publishedTopics().map((t) => t.path),
    ...report
      .filter((r) => ["agendamento", "recursos", "ajuda"].includes(r.template))
      .map((r) => r.path),
  ])("%s passes", (path) => {
    const result = report.find((r) => r.path === path)!;
    expect(result.reasons).toEqual([]);
  });

  it.each(report.filter((r) => r.template === "hub").map((r) => r.path))(
    "hub %s passes",
    (path) => {
      expect(report.find((r) => r.path === path)!.reasons).toEqual([]);
    },
  );
});

describe("similarity", () => {
  it("is 1 for the same text and low for different texts", () => {
    const a = shingles("o cliente marca o horário pelo link e recebe o lembrete por e-mail");
    const b = shingles("a sessão de psicologia exige discrição e um contrato claro com o paciente");
    expect(jaccard(a, a)).toBe(1);
    expect(jaccard(a, b)).toBeLessThan(0.1);
  });
});
