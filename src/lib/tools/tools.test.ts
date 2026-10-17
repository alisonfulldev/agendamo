import { describe, expect, it } from "vitest";

import { BIO_LIMIT, buildBios } from "./bio";
import { buildMessage, MESSAGE_KINDS } from "./messages";
import { noShowLoss } from "./no-show";

describe("noShowLoss", () => {
  it("computes the monthly and yearly loss and the visitor's assumption", () => {
    expect(
      noShowLoss({ appointments: 100, noShowPercent: 10, ticketCents: 5000, avoidedPercent: 50 }),
    ).toEqual({
      noShowsPerMonth: 10,
      lossPerMonthCents: 50000,
      lossPerYearCents: 600000,
      recoveredPerMonthCents: 25000,
      recoveredPerYearCents: 300000,
    });
  });

  it("never returns negative or invalid numbers", () => {
    const result = noShowLoss({
      appointments: -5,
      noShowPercent: 300,
      ticketCents: Number.NaN,
      avoidedPercent: -1,
    });
    expect(Object.values(result).every((v) => Number.isFinite(v) && v >= 0)).toBe(true);
  });
});

describe("buildMessage", () => {
  const fields = {
    customer: "Ana",
    service: "Escova",
    date: "sexta (17/10)",
    time: "14h",
    business: "Studio Lumi",
    link: "https://meetchat.com.br/studio-lumi",
  };

  it.each(MESSAGE_KINDS)("%s uses the fields and the link", (kind) => {
    const text = buildMessage(
      kind,
      { appointment: "horário", article: "o", formal: false },
      fields,
    );
    expect(text).toContain("Ana");
    expect(text).toContain("Escova");
    expect(text).toContain("https://meetchat.com.br/studio-lumi");
  });

  it("agrees with feminine words and uses a formal tone for health", () => {
    const text = buildMessage(
      "confirmacao",
      { appointment: "sessão", article: "a", formal: true },
      fields,
    );
    expect(text.startsWith("Olá, Ana!")).toBe(true);
    expect(text).toContain("Sua sessão de Escova está confirmada");
    const reminder = buildMessage(
      "lembrete",
      { appointment: "sessão", article: "a", formal: true },
      fields,
    );
    expect(reminder).toContain("lembrar da sua sessão");
  });

  it("fills placeholders when fields are empty", () => {
    const text = buildMessage(
      "confirmacao",
      { appointment: "horário", article: "o", formal: false },
      { customer: "", service: "", date: "", time: "", business: "", link: "" },
    );
    expect(text).toContain("[nome]");
    expect(text).toContain("me avise por aqui");
  });
});

describe("buildBios", () => {
  it("returns distinct bios within Instagram's limit", () => {
    const bios = buildBios({
      area: "Manicure e nail designer",
      highlight: "Alongamento em gel",
      place: "Moema, SP",
    });
    expect(bios.length).toBeGreaterThan(1);
    expect(new Set(bios).size).toBe(bios.length);
    for (const bio of bios) expect([...bio].length).toBeLessThanOrEqual(BIO_LIMIT);
  });
});
