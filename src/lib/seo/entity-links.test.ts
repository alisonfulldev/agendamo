import { describe, expect, it } from "vitest";

import { INTENT_PAGES } from "@/content/intent-pages";
import { TOOLS } from "@/content/tools";

import { createEntityLinker, ENTITY_LINKS } from "./entity-links";

describe("createEntityLinker", () => {
  it("links the first mention of each target, keeping the text as written", () => {
    const linker = createEntityLinker({ currentPath: "/barbearia/reduzir-faltas" });
    expect(
      linker.link("O Lembrete automático ajuda. Outro lembrete automático não vira link."),
    ).toEqual([
      "O ",
      { text: "Lembrete automático", href: "/agendamento/lembrete-automatico" },
      " ajuda. Outro lembrete automático não vira link.",
    ]);
  });

  it("never links the page to itself", () => {
    const linker = createEntityLinker({ currentPath: "/agendamento/link-na-bio" });
    expect(linker.link("Coloque o link na bio.")).toEqual(["Coloque o link na bio."]);
  });

  it("respects the page budget across paragraphs", () => {
    const linker = createEntityLinker({ currentPath: "/x", max: 2 });
    const parts = [
      ...linker.link("Use o link na bio e o lembrete automático."),
      ...linker.link("Veja o plano pago."),
    ];
    expect(parts.filter((p) => typeof p !== "string")).toHaveLength(2);
  });

  it("only matches whole words", () => {
    const linker = createEntityLinker({ currentPath: "/x" });
    expect(linker.link("modo WhatsAppzinho")).toEqual(["modo WhatsAppzinho"]);
  });

  it("every target is a page that exists", () => {
    const pages = new Set([
      ...INTENT_PAGES.map((p) => `/agendamento/${p.slug}`),
      ...TOOLS.map((t) => `/ferramentas/${t.slug}`),
      "/precos",
    ]);
    for (const entity of ENTITY_LINKS) expect(pages).toContain(entity.href);
  });
});
