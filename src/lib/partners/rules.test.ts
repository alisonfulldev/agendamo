import { describe, expect, it } from "vitest";

import { balanceOf, codeFromName, commissionFor, commissionState, isPartnerCode } from "./rules";

describe("programa de parceiros", () => {
  it("paga a 1ª mensalidade inteira e 20% das seguintes", () => {
    expect(commissionFor({ paymentCents: 2390, monthlyPriceCents: 2390, first: true })).toBe(2390);
    expect(commissionFor({ paymentCents: 2390, monthlyPriceCents: 2390, first: false })).toBe(478);
    expect(commissionFor({ paymentCents: 3900, monthlyPriceCents: 3900, first: false })).toBe(780);
  });

  it("no plano anual, a 1ª comissão é um mês, não o ano", () => {
    expect(commissionFor({ paymentCents: 23880, monthlyPriceCents: 2390, first: true })).toBe(2390);
    expect(commissionFor({ paymentCents: 23880, monthlyPriceCents: 2390, first: false })).toBe(
      4776,
    );
  });

  it("libera a comissão só depois do prazo", () => {
    const now = new Date("2026-12-31T12:00:00Z");
    expect(commissionState({ status: "pending", available_at: "2027-01-10T00:00:00Z" }, now)).toBe(
      "waiting",
    );
    expect(commissionState({ status: "pending", available_at: "2026-12-01T00:00:00Z" }, now)).toBe(
      "available",
    );
    expect(
      balanceOf(
        [
          { status: "pending", available_at: "2027-01-10T00:00:00Z", amount_cents: 2390 },
          { status: "pending", available_at: "2026-12-01T00:00:00Z", amount_cents: 478 },
          { status: "paid", available_at: "2026-11-01T00:00:00Z", amount_cents: 1000 },
          { status: "cancelled", available_at: "2026-11-01T00:00:00Z", amount_cents: 999 },
        ],
        now,
      ),
    ).toEqual({ waitingCents: 2390, availableCents: 478, paidCents: 1000 });
  });

  it("gera e valida o código do link", () => {
    expect(codeFromName("Maria José Souza")).toBe("mariajosesouza");
    expect(codeFromName("Li")).toBe("liparceiro");
    expect(isPartnerCode("mariasouza")).toBe(true);
    expect(isPartnerCode("Maria")).toBe(false);
    expect(isPartnerCode("ab")).toBe(false);
  });
});
