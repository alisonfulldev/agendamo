import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { briefingMissing, briefingSchema, briefingText } from "./briefing";
import { addBusinessDays } from "./paid";

describe("custom site (2026-11-06)", () => {
  it("promises 5 business days, skipping the weekend", () => {
    // Thursday 2026-11-05 + 5 business days = Thursday 2026-11-12.
    expect(addBusinessDays(new Date("2026-11-05T12:00:00Z"), 5).toISOString().slice(0, 10)).toBe(
      "2026-11-12",
    );
    // Friday + 1 = Monday.
    expect(addBusinessDays(new Date("2026-11-06T12:00:00Z"), 1).toISOString().slice(0, 10)).toBe(
      "2026-11-09",
    );
  });

  it("asks only style, highlights and a few words about the business", () => {
    const empty = briefingSchema.parse({});
    expect(briefingMissing(empty)).toHaveLength(3);
    const ready = briefingSchema.parse({
      styles: ["Elegante"],
      highlights: ["Antes e depois"],
      about: "Studio de unhas no centro, atendo há 8 anos.",
    });
    expect(briefingMissing(ready)).toEqual([]);
    expect(briefingSchema.safeParse({ styles: ["Neon"] }).success).toBe(false);
  });

  it("turns the briefing into a text to paste in the chat", () => {
    const text = briefingText(
      briefingSchema.parse({ styles: ["Delicado"], colors: "rosa", about: "Sobre mim" }),
      {
        business: "Studio Bela",
        niche: "Beleza",
        city: "Santos",
        site: "https://meetchat.com.br/studio-bela/site",
        photoUrls: ["https://img/1.webp"],
      },
    );
    expect(text).toContain("SITE PERSONALIZADO: Studio Bela (Beleza, Santos)");
    expect(text).toContain("Estilo: Delicado");
    expect(text).toContain("https://img/1.webp");
    expect(text).not.toContain("Referências");
  });
});
