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
  /**
   * "Site + Agenda" (2026-11-05): Completo + the landing page at /<slug>/site. R$ 49 until
   * 2026-11-07, then R$ 39 (subscribers at the new value from the next charge, needs_reprice).
   */
  site: { monthly: testPrice || 3900, yearly: testPrice || 39000 },
  /** "Site ou Loja" (2026-11-07): only a site or a store, no booking. */
  web: { monthly: testPrice || 2900, yearly: testPrice || 29000 },
  /** Custom site made by a person for "Site ou Loja": R$ 197 once, plus the R$ 29 month. */
  webCustomSite: 19700,
  /** Own domain for "Site ou Loja": R$ 120 a year, optional (asked in its sales chat). */
  webDomainYearly: 12000,
  extraProfessional: { monthly: 900, yearly: 9000 },
  featured: { monthly: 4900 },
  customDomain: { monthly: 1900 },
  /** Own .br domain sold with "Site + Agenda" (2026-11-06): first year in the first Pix. */
  domainYearly: 9100,
  /** Custom site (2026-11-06): the creation; with the first month of "Site + Agenda" = R$ 197. */
  customSite: 15800,
} as const;

export const PLAN_NAME = "Completo";
export const SITE_PLAN_NAME = "Site + Agenda";
export const WEB_PLAN_NAME = "Site ou Loja";

export type Cycle = "monthly" | "yearly";
/**
 * Which plan: "complete" (chat + agenda), "site" (the same + the landing page) or "web" (only a
 * site or a store, no booking: the "Site ou Loja" product).
 */
export type Tier = "complete" | "site" | "web";

export const TIER_NAME: Record<Tier, string> = {
  complete: PLAN_NAME,
  site: SITE_PLAN_NAME,
  web: WEB_PLAN_NAME,
};

/** Subscription value in cents for the plan and cycle, with extra professionals and a coupon. */
export function subscriptionPrice(
  cycle: Cycle,
  extraProfessionals: number,
  discountPercent = 0,
  tier: Tier = "complete",
): number {
  const base = PLAN_PRICES[tier][cycle] + PLAN_PRICES.extraProfessional[cycle] * extraProfessionals;
  return Math.round((base * (100 - discountPercent)) / 100);
}

/** How much the yearly plan saves compared to paying monthly for 12 months. */
export function yearlySavings(extraProfessionals = 0, tier: Tier = "complete"): number {
  return (
    subscriptionPrice("monthly", extraProfessionals, 0, tier) * 12 -
    subscriptionPrice("yearly", extraProfessionals, 0, tier)
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

const site = PLAN_PRICES.site;
/** Prices of "Site + Agenda" (same rules as PRICE_TEXT). */
export const SITE_PRICE_TEXT = {
  monthly: `${reais(site.monthly)}/mês`,
  yearly: `${reais(site.yearly)}/ano`,
  yearlyPerMonth: `${reais(Math.round(site.yearly / 12))}/mês`,
  summary: `${reais(site.monthly)}/mês ou ${reais(site.yearly)}/ano`,
  yearlySavings: `economize ${reais(yearlySavings(0, "site"))} por ano`,
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
  /** Paid plan (or the one being tested): "site" includes the landing page. */
  tier: Tier;
  /**
   * The landing page at /<slug>/site: in the trial (everyone tries it) and on "Site + Agenda".
   * Checked on the server for the page and the editor (rule 6).
   */
  site: boolean;
  /** "Site ou Loja" account: only the site (and the catalog); no booking features. */
  web: boolean;
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
  plan_tier?: Tier | null;
  product?: Business["product"] | null;
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
  // "Site ou Loja" (2026-11-07): only the site; nothing of the booking product.
  const web = (business.product ?? "booking") !== "booking";
  const booking = active && !web;

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
    tier: business.plan_tier ?? "complete",
    site: web ? active : trialActive || (subscribed && business.plan_tier === "site"),
    web,
    agenda: booking,
    reminders: booking,
    customers: booking,
    finance: booking,
    salesTools: booking,
    packagesAndCombos: booking,
    reviews: booking,
    stats: active,
    googleCalendar: booking,
    embed: booking,
    anyProfessional: booking,
    resources: booking,
    teamPermissions: booking,
    reportsByProfessional: booking,
    deposits: DEPOSITS_ENABLED && booking,
    photoLimit: PHOTO_LIMIT,
    professionalLimit: !booking ? 1 : trialActive ? TRIAL_PROFESSIONALS : seats,
  };
}

/** "Teste do Completo", "Completo", "Assinatura pendente". */
export function planLabel(features: PlanFeatures): string {
  if (features.status === "trial") return "Teste grátis";
  if (features.status === "subscribed") return TIER_NAME[features.tier];
  return "Assinatura pendente";
}
