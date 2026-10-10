import type { Appointment, Business, PaidPlan, Subscription } from "@/lib/db/types";
import { paidPlanOf, PLAN_PRICES, subscriptionPrice } from "@/lib/plans";

/** Monthly recurring revenue (cents) of a subscription: plan normalized to a month + active add-ons. */
export function monthlyRevenue(
  subscription: Pick<
    Subscription,
    "plan" | "billing_cycle" | "status" | "addons" | "extra_professionals"
  >,
): number {
  if (subscription.status !== "active" && subscription.status !== "overdue") return 0;
  const extras = subscription.extra_professionals ?? 0;
  const tier = paidPlanOf(subscription.plan) ?? "agenda";
  const plan =
    subscription.billing_cycle === "yearly"
      ? Math.round(subscriptionPrice(tier, "yearly", extras) / 12)
      : subscriptionPrice(tier, "monthly", extras);
  const featured =
    (subscription.addons.featured ?? []).filter((f) => f.status === "active").length *
    PLAN_PRICES.featured.monthly;
  const domain =
    subscription.addons.custom_domain?.status === "active" ? PLAN_PRICES.customDomain.monthly : 0;
  return plan + featured + domain;
}

export interface BrandMetrics {
  signupsByWeek: { week: string; count: number }[];
  businesses: number;
  activated: number;
  trials: number;
  activeTrials: number;
  subscribers: number;
  cancellations: number;
  mrrCents: number;
  /** What people chose at sign-up. */
  signupsByChoice: { free: number; trialAgenda: number; trialPro: number };
  /** Finished trials (ended or subscribed) and how many became paying, per plan. */
  trialConversion: Record<PaidPlan, { finished: number; paid: number }>;
  /** Accounts on Grátis after a trial or a cancelled subscription. */
  fellToFree: number;
  upgrades: number;
}

/** ISO Monday (UTC) of a timestamp, "YYYY-MM-DD". */
export function weekOf(iso: string): string {
  const d = new Date(iso);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

export function computeMetrics(
  businesses: Pick<
    Business,
    | "id"
    | "created_at"
    | "plan"
    | "trial_plan"
    | "trial_started_at"
    | "trial_ends_at"
    | "signup_choice"
  >[],
  subscriptions: Pick<
    Subscription,
    "business_id" | "plan" | "billing_cycle" | "status" | "addons" | "extra_professionals"
  >[],
  activatedIds: Set<string>,
  now = new Date(),
  weeks = 8,
  upgradedIds: Set<string> = new Set(),
): BrandMetrics {
  const ids = new Set(businesses.map((b) => b.id));
  const subs = subscriptions.filter((s) => ids.has(s.business_id));
  const currentWeek = weekOf(now.toISOString());
  const signupsByWeek = Array.from({ length: weeks }, (_, i) => {
    const d = new Date(`${currentWeek}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 7 * (weeks - 1 - i));
    const week = d.toISOString().slice(0, 10);
    return { week, count: businesses.filter((b) => weekOf(b.created_at) === week).length };
  });
  return {
    signupsByWeek,
    businesses: businesses.length,
    activated: businesses.filter((b) => activatedIds.has(b.id)).length,
    trials: businesses.filter((b) => b.trial_started_at).length,
    activeTrials: businesses.filter((b) => b.trial_ends_at && new Date(b.trial_ends_at) > now)
      .length,
    subscribers: subs.filter((s) => s.status === "active" || s.status === "overdue").length,
    cancellations: subs.filter((s) => s.status === "cancelled").length,
    mrrCents: subs.reduce((sum, s) => sum + monthlyRevenue(s), 0),
    signupsByChoice: {
      free: businesses.filter((b) => b.signup_choice === "free").length,
      trialAgenda: businesses.filter((b) => b.signup_choice === "trial_agenda").length,
      trialPro: businesses.filter((b) => b.signup_choice === "trial_pro").length,
    },
    trialConversion: {
      agenda: conversion(businesses, "agenda", now),
      pro: conversion(businesses, "pro", now),
    },
    fellToFree: businesses.filter((b) => {
      if (paidPlanOf(b.plan)) return false;
      const trialEnded = b.trial_ends_at !== null && new Date(b.trial_ends_at) <= now;
      const cancelled = subs.some((s) => s.business_id === b.id && s.status === "cancelled");
      return trialEnded || cancelled;
    }).length,
    upgrades: businesses.filter((b) => upgradedIds.has(b.id)).length,
  };
}

function conversion(
  businesses: Pick<Business, "plan" | "trial_plan" | "trial_ends_at">[],
  plan: PaidPlan,
  now: Date,
): { finished: number; paid: number } {
  const tested = businesses.filter((b) => b.trial_plan === plan);
  const paid = tested.filter((b) => paidPlanOf(b.plan)).length;
  const finished = tested.filter(
    (b) => paidPlanOf(b.plan) || (b.trial_ends_at !== null && new Date(b.trial_ends_at) <= now),
  ).length;
  return { finished, paid };
}

/** ISO timestamp of days days ago (kept out of render functions). */
export function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export interface DepositMetrics {
  withDeposit: number;
  /** Share of deposit bookings whose receipt was sent (0 to 1). */
  receiptRate: number;
  /** Average minutes from the receipt to the professional's decision. */
  avgMinutesToDecision: number | null;
  confirmed: number;
  refused: number;
  expired: number;
  duplicatesBlocked: number;
}

/** Deposits by Pix with receipts (Pro), for the admin page. */
export function computeDepositMetrics(
  appointments: Pick<Appointment, "deposit_status" | "deposit_sent_at" | "deposit_decided_at">[],
  duplicateReceipts: number,
): DepositMetrics {
  const withDeposit = appointments.filter((a) => a.deposit_status !== "none");
  const sent = withDeposit.filter((a) => a.deposit_sent_at);
  const decidedAfterReceipt = sent.filter(
    (a) => a.deposit_decided_at && ["confirmed", "refused", "refunded"].includes(a.deposit_status),
  );
  const minutes = decidedAfterReceipt.map(
    (a) =>
      (new Date(a.deposit_decided_at!).getTime() - new Date(a.deposit_sent_at!).getTime()) / 60_000,
  );
  return {
    withDeposit: withDeposit.length,
    receiptRate: withDeposit.length ? sent.length / withDeposit.length : 0,
    avgMinutesToDecision: minutes.length
      ? Math.round(minutes.reduce((sum, m) => sum + m, 0) / minutes.length)
      : null,
    confirmed: withDeposit.filter(
      (a) => a.deposit_status === "confirmed" || a.deposit_status === "refunded",
    ).length,
    refused: withDeposit.filter((a) => a.deposit_status === "refused").length,
    expired: withDeposit.filter((a) => a.deposit_status === "expired").length,
    duplicatesBlocked: duplicateReceipts,
  };
}
