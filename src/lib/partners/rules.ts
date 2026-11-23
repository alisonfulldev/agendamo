/** Partner program rules (2026-11-23). Pure: shared by the server, the pages and the tests. */

/** Query parameter of the partner link: meetchat.com.br/?parceiro=<code>. */
export const PARTNER_PARAM = "parceiro";
export const PARTNER_COOKIE = "mc_parceiro";
/** The link counts for sign-ups up to 60 days after the visit. */
export const PARTNER_COOKIE_DAYS = 60;

/** 100% of the client's first payment (up to one month of the plan)… */
export const FIRST_PAYMENT_PERCENT = 100;
/** …and 20% of every payment after it, while the client pays. */
export const RECURRING_PERCENT = 20;
/** Commission released for payment this many days after the client's payment. */
export const HOLD_DAYS = 30;
/** Minimum available balance for a payout. */
export const MIN_PAYOUT_CENTS = 5000;

export const PARTNER_TERMS_VERSION = "2026-11-23";

export function isPartnerCode(value: string | null | undefined): value is string {
  return typeof value === "string" && /^[a-z0-9]{4,20}$/.test(value);
}

/**
 * Commission of one client payment. The first one is the whole payment, capped at one month of
 * the plan (a yearly plan pays one month, not the year); the next ones are 20%.
 */
export function commissionFor(input: {
  paymentCents: number;
  monthlyPriceCents: number;
  first: boolean;
}): number {
  const payment = Math.max(0, Math.round(input.paymentCents));
  if (input.first)
    return Math.min(payment, Math.round((input.monthlyPriceCents * FIRST_PAYMENT_PERCENT) / 100));
  return Math.round((payment * RECURRING_PERCENT) / 100);
}

/** Code suggested from the partner's name ("Maria Souza" -> "mariasouza"), before uniqueness. */
export function codeFromName(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 14);
  return base.length >= 4 ? base : `${base}parceiro`.slice(0, 14);
}

export type CommissionState = "waiting" | "available" | "paid" | "cancelled";

export function commissionState(
  row: { status: string; available_at: string },
  now: Date = new Date(),
): CommissionState {
  if (row.status === "paid") return "paid";
  if (row.status === "cancelled") return "cancelled";
  return new Date(row.available_at) <= now ? "available" : "waiting";
}

export interface Balance {
  waitingCents: number;
  availableCents: number;
  paidCents: number;
}

export function balanceOf(
  rows: { status: string; available_at: string; amount_cents: number }[],
  now: Date = new Date(),
): Balance {
  const balance: Balance = { waitingCents: 0, availableCents: 0, paidCents: 0 };
  for (const row of rows) {
    const state = commissionState(row, now);
    if (state === "waiting") balance.waitingCents += row.amount_cents;
    else if (state === "available") balance.availableCents += row.amount_cents;
    else if (state === "paid") balance.paidCents += row.amount_cents;
  }
  return balance;
}
