import type { Business, PaidPlan, Plan } from "@/lib/db/types";
import { formatBRL } from "@/lib/money";

/**
 * Three plans (2026-10-10):
 * - Grátis: forever, 10 automatic (chat) bookings per 30-day cycle counted from the sign-up date;
 *   past the limit the chat hands off to WhatsApp until the cycle ends. No reminders, no chat on
 *   external sites. Only the chat and the agenda (the rest is locked).
 * - Agenda: unlimited bookings, reminders, chat on the site and everything else.
 * Every plan shows "Agende também com o MeetChat" in the chat and on the profile.
 * - Pro: everything in Agenda + deposit / full payment by the customer (built in a separate step:
 *   off by DEPOSITS_ENABLED until then, shown as "em breve").
 * 7-day trial of Agenda or Pro, once per account (no card). Stored values: plan "free" (also
 * during a trial: trial_plan says which), "agenda" or "pro" = subscribed ("team" is legacy = pro).
 */
export const TRIAL_DAYS = 7;
export const FREE_BOOKINGS_PER_CYCLE = 10;
export const FREE_CYCLE_DAYS = 30;

/** Deposit / full payment by the customer (Pro): off until its own step is built. */
export const DEPOSITS_ENABLED = false;

/** Professionals allowed while testing (so a team can try everything). */
export const TRIAL_PROFESSIONALS = 10;
export const MAX_PROFESSIONALS = 50;

/**
 * Temporary real-payment test: while NEXT_PUBLIC_PRICE_TEST_CENTS is set (e.g. 500 = R$ 5, the
 * Asaas minimum), every paid plan costs that, monthly and yearly. Remove it to go back.
 */
const TEST_PRICE = Number(process.env.NEXT_PUBLIC_PRICE_TEST_CENTS) || 0;
const ASAAS_MINIMUM_CENTS = 500;
const testPrice = TEST_PRICE > 0 ? Math.max(TEST_PRICE, ASAAS_MINIMUM_CENTS) : 0;

export const PLAN_PRICES = {
  agenda: { monthly: testPrice || 1990, yearly: testPrice || 17880 },
  pro: { monthly: testPrice || 3990, yearly: testPrice || 35880 },
  extraProfessional: { monthly: 900, yearly: 9000 },
  featured: { monthly: 4900 },
  customDomain: { monthly: 1900 },
} as const;

export type Cycle = "monthly" | "yearly";
export type PlanTier = "free" | PaidPlan;

export const PLAN_NAMES: Record<PlanTier, string> = {
  free: "Grátis",
  agenda: "Agenda",
  pro: "Pro",
};

/** Subscription value in cents for the plan and cycle, with extra professionals and a coupon. */
export function subscriptionPrice(
  plan: PaidPlan,
  cycle: Cycle,
  extraProfessionals: number,
  discountPercent = 0,
): number {
  const base = PLAN_PRICES[plan][cycle] + PLAN_PRICES.extraProfessional[cycle] * extraProfessionals;
  return Math.round((base * (100 - discountPercent)) / 100);
}

/** How much the yearly plan saves compared to paying monthly for 12 months. */
export function yearlySavings(plan: PaidPlan, extraProfessionals = 0): number {
  return (
    subscriptionPrice(plan, "monthly", extraProfessionals) * 12 -
    subscriptionPrice(plan, "yearly", extraProfessionals)
  );
}

/** "R$ 49" (whole reais without ",00"), "R$ 19,90". */
export const reais = (cents: number) => formatBRL(cents).replace(/,00$/, "");

function planText(plan: PaidPlan) {
  const prices = PLAN_PRICES[plan];
  return {
    monthly: `${reais(prices.monthly)}/mês`,
    yearly: `${reais(prices.yearly)}/ano`,
    yearlyPerMonth: `${reais(Math.round(prices.yearly / 12))}/mês`,
    summary: `${reais(prices.monthly)}/mês ou ${reais(Math.round(prices.yearly / 12))}/mês no anual`,
  };
}

/** Prices as shown in copy (site, FAQ, e-mails): always derived from PLAN_PRICES. */
export const PRICE_TEXT = {
  agenda: planText("agenda"),
  pro: planText("pro"),
  extraProfessional: `${reais(PLAN_PRICES.extraProfessional.monthly)}/mês`,
  free: `Grátis para sempre com ${FREE_BOOKINGS_PER_CYCLE} agendamentos por mês`,
  trial: `Teste o Agenda ou o Pro por ${TRIAL_DAYS} dias, sem cartão`,
  /** Under the chat at the top of the site. */
  heroNote: "Grátis · sem cartão · pronto em 1 minuto",
  /** "Preciso de cartão?" (FAQ of every brand). */
  noCard: `Não. O Grátis é para sempre, com ${FREE_BOOKINGS_PER_CYCLE} agendamentos por mês, sem cartão. Para testar o Agenda (${planText("agenda").monthly}) ou o Pro (${planText("pro").monthly}), são ${TRIAL_DAYS} dias grátis, também sem cartão.`,
};

export type PlanStatus = "free" | "trial" | "subscribed";

export interface PlanFeatures {
  /** Plan in effect now: the subscribed one, the one being tested, or "free". */
  tier: PlanTier;
  status: PlanStatus;
  subscribed: boolean;
  trialActive: boolean;
  /** Plan being tested (or tested before), null when the trial was never used. */
  trialPlan: PaidPlan | null;
  trialEndsAt: Date | null;
  /** Days left in the trial, counting today (7 right after starting, 1 on the last day). */
  trialDaysLeft: number | null;
  /** The 7-day trial can still be started (never used, not subscribed). */
  trialAvailable: boolean;
  /** Grátis: automatic bookings limited per 30-day cycle (see lib/plan-usage). */
  limitedBookings: boolean;
  agenda: boolean;
  reminders: boolean;
  removeBranding: boolean;
  customers: boolean;
  finance: boolean;
  salesTools: boolean;
  packagesAndCombos: boolean;
  reviews: boolean;
  stats: boolean;
  deposits: boolean;
  googleCalendar: boolean;
  embed: boolean;
  anyProfessional: boolean;
  resources: boolean;
  teamPermissions: boolean;
  reportsByProfessional: boolean;
  photoLimit: number;
  professionalLimit: number;
}

/** Paid features that show a lock (and the subscription modal) on the Grátis plan. */
export type LockedFeature =
  | "customers"
  | "finance"
  | "salesTools"
  | "packagesAndCombos"
  | "reviews"
  | "stats"
  | "googleCalendar"
  | "embed"
  | "anyProfessional";

export const PHOTO_LIMIT = 60;

type PlanFields = Pick<Business, "plan" | "trial_ends_at"> & {
  trial_plan?: PaidPlan | null;
  trial_started_at?: string | null;
  professional_seats?: number | null;
};

/** "team" is legacy and counts as Pro. */
export function paidPlanOf(plan: Plan): PaidPlan | null {
  if (plan === "agenda") return "agenda";
  if (plan === "pro" || plan === "team") return "pro";
  return null;
}

/**
 * Plan rules, always evaluated on the server (rule 6). Changing plan, trial or seats in the
 * database changes the result immediately: nothing is cached.
 */
export function getPlanFeatures(business: PlanFields, now: Date = new Date()): PlanFeatures {
  const paid = paidPlanOf(business.plan);
  const trialEndsAt = business.trial_ends_at ? new Date(business.trial_ends_at) : null;
  const trialPlan: PaidPlan | null =
    business.trial_plan ?? (business.trial_started_at || trialEndsAt ? "pro" : null);
  const trialActive = !paid && trialEndsAt !== null && trialEndsAt > now;
  const tier: PlanTier = paid ?? (trialActive ? (trialPlan ?? "agenda") : "free");
  const status: PlanStatus = paid ? "subscribed" : trialActive ? "trial" : "free";
  const full = tier !== "free";
  const seats = Math.max(1, business.professional_seats ?? 1);

  return {
    tier,
    status,
    subscribed: Boolean(paid),
    trialActive,
    trialPlan,
    trialEndsAt,
    trialDaysLeft: trialActive
      ? Math.max(1, Math.ceil((trialEndsAt!.getTime() - now.getTime()) / 86_400_000))
      : null,
    trialAvailable: !paid && trialEndsAt === null && !business.trial_started_at,
    limitedBookings: !full,
    agenda: true,
    reminders: full,
    // Every plan shows "Agende também com o MeetChat" (decided 2026-10-10).
    removeBranding: false,
    customers: full,
    finance: full,
    salesTools: full,
    packagesAndCombos: full,
    reviews: full,
    stats: full,
    deposits: DEPOSITS_ENABLED && tier === "pro",
    googleCalendar: full,
    embed: full,
    anyProfessional: full,
    resources: full,
    teamPermissions: full,
    reportsByProfessional: full,
    photoLimit: PHOTO_LIMIT,
    professionalLimit: !full ? 1 : trialActive ? TRIAL_PROFESSIONALS : seats,
  };
}

/** "Grátis", "Teste do Agenda", "Pro"… */
export function planLabel(features: PlanFeatures): string {
  if (features.status === "trial") return `Teste do ${PLAN_NAMES[features.tier]}`;
  return PLAN_NAMES[features.tier];
}
