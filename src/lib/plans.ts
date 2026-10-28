import type { Business } from "@/lib/db/types";
import { formatBRL } from "@/lib/money";

/**
 * One plan, Completo (2026-10-12): unlimited bookings, reminders, a discreet brand line, chat on
 * external sites, team, finance, deposit / full payment by Pix with a receipt and everything else. Every sign-up starts with a 14-day trial of
 * it (no card, once per person). Without a trial or an active subscription the account is in
 * "waiting mode": the public chat keeps working but ends on WhatsApp (nothing is booked), with
 * "Agende também com o MeetChat" in the footer, and the panel opens only the subscription screen.
 * Nothing is deleted; subscribing brings everything back at once.
 * Stored values: plan "free" (no subscription: trial or waiting) or "complete" (subscribed).
 */
export const TRIAL_DAYS = 14;

/** Deposit / full payment by Pix with a receipt (lib/deposits), included in Completo. */
export const DEPOSITS_ENABLED = true;

/** Professionals allowed while testing (so a team can try everything). */
export const TRIAL_PROFESSIONALS = 10;
export const MAX_PROFESSIONALS = 50;

/**
 * Temporary real-payment test: while NEXT_PUBLIC_PRICE_TEST_CENTS is set (e.g. 500 = R$ 5, the
 * Asaas minimum), the plan costs that, monthly and yearly. Remove it to go back.
 */
const TEST_PRICE = Number(process.env.NEXT_PUBLIC_PRICE_TEST_CENTS) || 0;
const ASAAS_MINIMUM_CENTS = 500;
const testPrice = TEST_PRICE > 0 ? Math.max(TEST_PRICE, ASAAS_MINIMUM_CENTS) : 0;

export const PLAN_PRICES = {
  complete: { monthly: testPrice || 2390, yearly: testPrice || 23880 },
  extraProfessional: { monthly: 900, yearly: 9000 },
  featured: { monthly: 4900 },
  customDomain: { monthly: 1900 },
} as const;

export const PLAN_NAME = "Completo";

export type Cycle = "monthly" | "yearly";

/** Subscription value in cents for the cycle, with extra professionals and a coupon. */
export function subscriptionPrice(
  cycle: Cycle,
  extraProfessionals: number,
  discountPercent = 0,
): number {
  const base =
    PLAN_PRICES.complete[cycle] + PLAN_PRICES.extraProfessional[cycle] * extraProfessionals;
  return Math.round((base * (100 - discountPercent)) / 100);
}

/** How much the yearly plan saves compared to paying monthly for 12 months. */
export function yearlySavings(extraProfessionals = 0): number {
  return (
    subscriptionPrice("monthly", extraProfessionals) * 12 -
    subscriptionPrice("yearly", extraProfessionals)
  );
}

/** "R$ 49" (whole reais without ",00"), "R$ 23,90". */
export const reais = (cents: number) => formatBRL(cents).replace(/,00$/, "");

const prices = PLAN_PRICES.complete;
const monthlyText = `${reais(prices.monthly)}/mês`;
const yearlyPerMonthText = `${reais(Math.round(prices.yearly / 12))}/mês`;

/** Prices as shown in the panel and in e-mails (never on the public pages): from PLAN_PRICES. */
export const PRICE_TEXT = {
  monthly: monthlyText,
  yearly: `${reais(prices.yearly)}/ano`,
  yearlyPerMonth: yearlyPerMonthText,
  summary: `${monthlyText} ou ${yearlyPerMonthText} no anual`,
  yearlySavings: `economize ${reais(yearlySavings())} por ano`,
  extraProfessional: `${reais(PLAN_PRICES.extraProfessional.monthly)}/mês`,
  trial: `${TRIAL_DAYS} dias grátis, sem cartão`,
};

/** trial: the 14 days; subscribed: paying; waiting: neither (chat ends on WhatsApp). */
export type PlanStatus = "trial" | "subscribed" | "waiting";

export interface PlanFeatures {
  status: PlanStatus;
  /** Trial or subscription: everything works. False = waiting mode. */
  active: boolean;
  subscribed: boolean;
  trialActive: boolean;
  trialEndsAt: Date | null;
  /** Days left in the trial, counting today (14 right after starting, 1 on the last day). */
  trialDaysLeft: number | null;
  /**
   * The MeetChat badge shows on every business link (2026-10-27): the full "Agende também com o
   * MeetChat" card in waiting mode, a small discreet line in the trial and the paid plan.
   */
  discreetBadge: boolean;
  // Server checks of each feature (rule 6): all of them follow `active` (one plan).
  agenda: boolean;
  reminders: boolean;
  customers: boolean;
  finance: boolean;
  salesTools: boolean;
  packagesAndCombos: boolean;
  reviews: boolean;
  stats: boolean;
  googleCalendar: boolean;
  embed: boolean;
  anyProfessional: boolean;
  resources: boolean;
  teamPermissions: boolean;
  reportsByProfessional: boolean;
  deposits: boolean;
  photoLimit: number;
  professionalLimit: number;
}

/** Gallery photos per business (60 until 2026-10-27; 20 is plenty for a profile). */
export const PHOTO_LIMIT = 20;

type PlanFields = Pick<Business, "plan" | "trial_ends_at"> & {
  trial_started_at?: string | null;
  professional_seats?: number | null;
};

/**
 * Plan rules, always evaluated on the server (rule 6). Changing plan, trial or seats in the
 * database changes the result immediately: nothing is cached.
 */
export function getPlanFeatures(business: PlanFields, now: Date = new Date()): PlanFeatures {
  const subscribed = business.plan === "complete";
  const trialEndsAt = business.trial_ends_at ? new Date(business.trial_ends_at) : null;
  const trialActive = !subscribed && trialEndsAt !== null && trialEndsAt > now;
  const active = subscribed || trialActive;
  const seats = Math.max(1, business.professional_seats ?? 1);

  return {
    status: subscribed ? "subscribed" : trialActive ? "trial" : "waiting",
    active,
    subscribed,
    trialActive,
    trialEndsAt,
    trialDaysLeft: trialActive
      ? Math.max(1, Math.ceil((trialEndsAt!.getTime() - now.getTime()) / 86_400_000))
      : null,
    discreetBadge: active,
    agenda: active,
    reminders: active,
    customers: active,
    finance: active,
    salesTools: active,
    packagesAndCombos: active,
    reviews: active,
    stats: active,
    googleCalendar: active,
    embed: active,
    anyProfessional: active,
    resources: active,
    teamPermissions: active,
    reportsByProfessional: active,
    deposits: DEPOSITS_ENABLED && active,
    photoLimit: PHOTO_LIMIT,
    professionalLimit: !active ? 1 : trialActive ? TRIAL_PROFESSIONALS : seats,
  };
}

/** "Teste do Completo", "Completo", "Assinatura pendente". */
export function planLabel(features: PlanFeatures): string {
  if (features.status === "trial") return `Teste do ${PLAN_NAME}`;
  if (features.status === "subscribed") return PLAN_NAME;
  return "Assinatura pendente";
}
