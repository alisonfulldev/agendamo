import type { Business, Plan } from "@/lib/db/types";
import { formatBRL } from "@/lib/money";

/**
 * Single plan (prices from 2026-10-05): 30-day trial from sign-up (no card), then R$ 19/month or
 * R$ 192/year (R$ 16/month). 1 professional included; each extra one R$ 9/month (R$ 90/year).
 * Stored values: plan "free" = no subscription (trial or expired), "pro" = subscribed
 * ("team" is legacy and counts as "pro").
 */
export const TRIAL_DAYS = 30;

/** Professionals allowed while testing (so a team can try everything). */
export const TRIAL_PROFESSIONALS = 10;
export const MAX_PROFESSIONALS = 50;

export const PLAN_PRICES = {
  monthly: 1900,
  yearly: 19200,
  extraProfessional: { monthly: 900, yearly: 9000 },
  featured: { monthly: 4900 },
  customDomain: { monthly: 1900 },
} as const;

export type Cycle = "monthly" | "yearly";

/** Subscription value in cents for the cycle, with extra professionals and a coupon. */
export function subscriptionPrice(cycle: Cycle, extraProfessionals: number, discountPercent = 0) {
  const base = PLAN_PRICES[cycle] + PLAN_PRICES.extraProfessional[cycle] * extraProfessionals;
  return Math.round((base * (100 - discountPercent)) / 100);
}

/** How much the yearly plan saves compared to paying monthly for 12 months. */
export function yearlySavings(extraProfessionals: number): number {
  return (
    subscriptionPrice("monthly", extraProfessionals) * 12 -
    subscriptionPrice("yearly", extraProfessionals)
  );
}

/** "R$ 49" (whole reais without ",00"). */
const reais = (cents: number) => formatBRL(cents).replace(/,00$/, "");

/** Prices as shown in copy (FAQ, e-mails): always derived from PLAN_PRICES. */
export const PRICE_TEXT = {
  monthly: `${reais(PLAN_PRICES.monthly)}/mês`,
  yearly: `${reais(PLAN_PRICES.yearly)}/ano`,
  yearlyPerMonth: `${reais(Math.round(PLAN_PRICES.yearly / 12))}/mês`,
  extraProfessional: `${reais(PLAN_PRICES.extraProfessional.monthly)}/mês`,
  summary: `${reais(PLAN_PRICES.monthly)}/mês ou ${reais(PLAN_PRICES.yearly)}/ano (sai ${reais(Math.round(PLAN_PRICES.yearly / 12))}/mês)`,
};

export type PlanStatus = "trial" | "subscribed" | "expired";

export interface PlanFeatures {
  /** "pro" while testing or subscribed, "free" when the trial ended without a subscription. */
  plan: Plan;
  status: PlanStatus;
  /** Everything works (trial or subscription). False = expired: chat hands off to WhatsApp. */
  active: boolean;
  trialActive: boolean;
  trialEndsAt: Date | null;
  /** Whole days left in the trial (0 on the last day), null when not testing. */
  trialDaysLeft: number | null;
  chatBooking: boolean;
  agenda: boolean;
  reminders: boolean;
  removeBranding: boolean;
  salesTools: boolean;
  deposits: boolean;
  packagesAndCombos: boolean;
  googleCalendar: boolean;
  embed: boolean;
  anyProfessional: boolean;
  resources: boolean;
  teamPermissions: boolean;
  reportsByProfessional: boolean;
  finance: boolean;
  photoLimit: number;
  professionalLimit: number;
}

export const PHOTO_LIMIT = 60;

/**
 * Plan rules, always evaluated on the server (rule 6). Changing trial dates, plan or seats in the
 * database changes the result immediately: nothing is cached.
 */
export function getPlanFeatures(
  business: Pick<Business, "plan" | "trial_started_at" | "trial_ends_at"> & {
    professional_seats?: number | null;
  },
  now: Date = new Date(),
): PlanFeatures {
  const trialEndsAt = business.trial_ends_at ? new Date(business.trial_ends_at) : null;
  const subscribed = business.plan !== "free";
  const trialActive = !subscribed && trialEndsAt !== null && trialEndsAt > now;
  const active = subscribed || trialActive;
  const status: PlanStatus = subscribed ? "subscribed" : trialActive ? "trial" : "expired";
  const seats = Math.max(1, business.professional_seats ?? 1);

  return {
    plan: active ? "pro" : "free",
    status,
    active,
    trialActive,
    trialEndsAt,
    trialDaysLeft: trialActive
      ? Math.max(0, Math.floor((trialEndsAt!.getTime() - now.getTime()) / 86_400_000))
      : null,
    chatBooking: active,
    agenda: active,
    reminders: active,
    removeBranding: subscribed,
    salesTools: active,
    deposits: active,
    packagesAndCombos: active,
    googleCalendar: active,
    embed: active,
    anyProfessional: active,
    resources: active,
    teamPermissions: active,
    reportsByProfessional: active,
    finance: active,
    photoLimit: PHOTO_LIMIT,
    professionalLimit: trialActive ? TRIAL_PROFESSIONALS : seats,
  };
}

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  trial: "Teste grátis",
  subscribed: "Assinante",
  expired: "Teste encerrado",
};
