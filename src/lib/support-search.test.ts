import { describe, expect, it } from "vitest";

import { SUPPORT_ITEMS } from "@/content/support";

import {
  normalize,
  searchSupport,
  stem,
  suggestionsFor,
  understand,
  visibleSupport,
} from "./support-search";

const first = (query: string) => searchSupport(SUPPORT_ITEMS, query)[0]?.id;

describe("support search", () => {
  it("normalizes accents, case and punctuation, and stems verb and plural forms", () => {
    expect(normalize("Não consigo mudar o NOME!")).toBe("nao consigo mudar o nome");
    expect(stem("mudei")).toBe(stem("mudar"));
    expect(stem("mudando")).toBe(stem("mudar"));
    expect(stem("servicos")).toBe(stem("servico"));
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

  it("understands synonyms and other ways to say it", () => {
    expect(first("quero trocar a foto do perfil")).toBe("photo");
    expect(first("alterar meu horário de funcionamento")).toBe("hours");
    expect(first("como faço pra tirar um serviço do chat")).toBe("hide-service");
    expect(first("onde vejo quanto ganhei no mês")).toBe("finance");
    expect(first("apagar minha conta")).toBe("delete-account");
    expect(first("lista dos meus pacientes")).toBe("customers");
    expect(first("não chega notificação no celular")).toBe("push");
    expect(first("oi, como mudo o nome?")).toBe("business-name");
  });

  it("tolerates typos", () => {
    expect(first("horaios de atendimeto")).toBe("hours");
    expect(first("importar planilia de clientes")).toBe("import");
  });

  it("greets, thanks, asks for more when vague, and returns nothing when unrelated", () => {
    expect(understand(SUPPORT_ITEMS, "oi").kind).toBe("greeting");
    expect(understand(SUPPORT_ITEMS, "bom dia").kind).toBe("greeting");
    expect(understand(SUPPORT_ITEMS, "obrigada!").kind).toBe("thanks");
    expect(understand(SUPPORT_ITEMS, "quero mudar").kind).toBe("vague");
    expect(understand(SUPPORT_ITEMS, "qual a previsão do tempo amanhã").kind).toBe("none");
    expect(searchSupport(SUPPORT_ITEMS, "   ")).toEqual([]);
  });

  it("asks which one when two answers are equally likely", () => {
    const result = understand(SUPPORT_ITEMS, "preço");
    expect(["answer", "choose"]).toContain(result.kind);
    const ambiguous = understand(SUPPORT_ITEMS, "cancelar");
    expect(ambiguous.kind).toBe("choose");
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
