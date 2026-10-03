/** Owner's simple finance: revenues (automatic from completed appointments + manual) and costs. */

export type FinanceKind = "income" | "expense";
export type PaymentMethod = "pix" | "cash" | "card" | "other";

export interface FinanceEntry {
  id: string;
  kind: FinanceKind;
  category: string;
  description: string;
  amount_cents: number;
  occurred_on: string;
  payment_method: PaymentMethod | null;
  customer_id: string | null;
  appointment_id: string | null;
  customer?: { name: string } | null;
}

export const INCOME_CATEGORIES = ["Atendimento", "Venda de produto", "Pacote", "Outros"] as const;

export const EXPENSE_CATEGORIES = [
  "Aluguel",
  "Produtos e materiais",
  "Comissão",
  "Contas (luz, água, internet)",
  "Marketing",
  "Impostos e taxas",
  "Equipamentos",
  "Outros",
] as const;

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: "Pix",
  cash: "Dinheiro",
  card: "Cartão",
  other: "Outro",
};

/** "2026-10" for a date, in the business timezone (computed by the caller). */
export function monthRange(month: string): { from: string; to: string } {
  const [year, m] = month.split("-").map(Number) as [number, number];
  const next = m === 12 ? `${year + 1}-01` : `${year}-${String(m + 1).padStart(2, "0")}`;
  return { from: `${month}-01`, to: `${next}-01` };
}

export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number) as [number, number];
  const index = year * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

export interface FinanceSummary {
  income: number;
  expense: number;
  profit: number;
  byMethod: Record<PaymentMethod | "unknown", number>;
  byExpenseCategory: { category: string; amount: number }[];
}

export function summarize(
  entries: Pick<FinanceEntry, "kind" | "amount_cents" | "payment_method" | "category">[],
): FinanceSummary {
  const byMethod: FinanceSummary["byMethod"] = { pix: 0, cash: 0, card: 0, other: 0, unknown: 0 };
  const categories = new Map<string, number>();
  let income = 0;
  let expense = 0;
  for (const entry of entries) {
    if (entry.kind === "income") {
      income += entry.amount_cents;
      byMethod[entry.payment_method ?? "unknown"] += entry.amount_cents;
    } else {
      expense += entry.amount_cents;
      categories.set(entry.category, (categories.get(entry.category) ?? 0) + entry.amount_cents);
    }
  }
  return {
    income,
    expense,
    profit: income - expense,
    byMethod,
    byExpenseCategory: [...categories.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount),
  };
}
