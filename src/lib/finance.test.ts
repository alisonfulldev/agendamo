import { describe, expect, it } from "vitest";

import { monthRange, shiftMonth, summarize } from "@/lib/finance";

describe("finance", () => {
  it("month ranges and navigation across years", () => {
    expect(monthRange("2026-12")).toEqual({ from: "2026-12-01", to: "2027-01-01" });
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });

  it("totals, profit, revenues per payment method and costs per category", () => {
    const summary = summarize([
      { kind: "income", amount_cents: 5000, payment_method: "pix", category: "Atendimento" },
      { kind: "income", amount_cents: 3000, payment_method: null, category: "Atendimento" },
      {
        kind: "expense",
        amount_cents: 1000,
        payment_method: null,
        category: "Produtos e materiais",
      },
      { kind: "expense", amount_cents: 9000, payment_method: null, category: "Aluguel" },
    ]);
    expect(summary).toMatchObject({ income: 8000, expense: 10000, profit: -2000 });
    expect(summary.byMethod).toMatchObject({ pix: 5000, unknown: 3000 });
    expect(summary.byExpenseCategory[0]).toEqual({ category: "Aluguel", amount: 9000 });
  });
});
