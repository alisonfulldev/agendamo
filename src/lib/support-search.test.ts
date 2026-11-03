import { describe, expect, it } from "vitest";

import { SUPPORT_ITEMS } from "@/content/support";

import { normalize, searchSupport, suggestionsFor, visibleSupport } from "./support-search";

const first = (query: string) => searchSupport(SUPPORT_ITEMS, query)[0]?.id;

describe("support search", () => {
  it("normalizes accents, case and punctuation", () => {
    expect(normalize("Não consigo mudar o NOME!")).toBe("nao consigo mudar o nome");
  });

  it("finds the right answer in the owner's own words", () => {
    expect(first("como mudo o nome do meu negócio")).toBe("business-name");
    expect(first("errei o nome no cadastro, quero corrigir nome")).toBe("business-name");
    expect(first("errei o nome, quero mudar o nome")).toBe("business-name");
    expect(first("bloquear sábado que vou viajar")).toBe("block");
    expect(first("cobrar sinal no pix")).toBe("deposit-setup");
    expect(first("conectar google agenda")).toBe("google-calendar");
    expect(first("trocar senha")).toBe("password");
    expect(first("remarcar cliente")).toBe("reschedule");
  });

  it("tolerates typos", () => {
    expect(first("horaios de atendimeto")).toBe("hours");
    expect(first("importar planilia de clientes")).toBe("import");
  });

  it("returns nothing for unrelated text", () => {
    expect(searchSupport(SUPPORT_ITEMS, "qual a previsão do tempo amanhã")).toEqual([]);
    expect(searchSupport(SUPPORT_ITEMS, "   ")).toEqual([]);
  });

  it("suggests by screen and hides owner-only answers from staff", () => {
    const onAgenda = suggestionsFor(SUPPORT_ITEMS, "/painel/agenda").map((i) => i.id);
    expect(onAgenda).toContain("new-appointment");
    const staff = visibleSupport(SUPPORT_ITEMS, false).map((i) => i.id);
    expect(staff).toContain("reschedule");
    expect(staff).not.toContain("business-name");
    expect(staff).not.toContain("cancel-plan");
  });

  it("every item points to a panel screen and has keywords", () => {
    for (const item of SUPPORT_ITEMS) {
      expect(item.keywords.length).toBeGreaterThan(0);
      if (item.href) expect(item.href.startsWith("/painel")).toBe(true);
    }
    expect(new Set(SUPPORT_ITEMS.map((i) => i.id)).size).toBe(SUPPORT_ITEMS.length);
  });
});
