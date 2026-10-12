import type { Appointment, Business, Subscription } from "@/lib/db/types";
import { PLAN_PRICES, subscriptionPrice } from "@/lib/plans";

/** Monthly recurring revenue (cents) of a subscription: plan normalized to a month + active add-ons. */
export function monthlyRevenue(
  subscription: Pick<
    Subscription,
    "plan" | "billing_cycle" | "status" | "addons" | "extra_professionals"
  >,
): number {
  if (subscription.status !== "active" && subscription.status !== "overdue") return 0;
  const extras = subscription.extra_professionals ?? 0;
  const plan =
    subscription.billing_cycle === "yearly"
      ? Math.round(subscriptionPrice("yearly", extras) / 12)
      : subscriptionPrice("monthly", extras);
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
  /** Finished trials (ended or subscribed) and how many became paying. */
  trialConversion: { finished: number; paid: number };
  /** Accounts in waiting mode (trial ended or subscription ended without payment). */
  waiting: number;
}

/** ISO Monday (UTC) of a timestamp, "YYYY-MM-DD". */
export function weekOf(iso: string): string {
  const d = new Date(iso);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

export function computeMetrics(
  businesses: Pick<Business, "id" | "created_at" | "plan" | "trial_started_at" | "trial_ends_at">[],
  subscriptions: Pick<
    Subscription,
    "business_id" | "plan" | "billing_cycle" | "status" | "addons" | "extra_professionals"
  >[],
  activatedIds: Set<string>,
  now = new Date(),
  weeks = 8,
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
    trialConversion: conversion(businesses, now),
    waiting: businesses.filter(
      (b) =>
        b.plan !== "complete" && (b.trial_ends_at === null || new Date(b.trial_ends_at) <= now),
    ).length,
  };
}

function conversion(
  businesses: Pick<Business, "plan" | "trial_started_at" | "trial_ends_at">[],
  now: Date,
): { finished: number; paid: number } {
  const tested = businesses.filter((b) => b.trial_started_at);
  const paid = tested.filter((b) => b.plan === "complete").length;
  const finished = tested.filter(
    (b) => b.plan === "complete" || (b.trial_ends_at !== null && new Date(b.trial_ends_at) <= now),
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

/** Deposits by Pix with receipts, for the admin page. */
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

// ---------------------------------------------------------------------------
// Admin panel (overview, businesses).

export type AdminStatus = "trial" | "subscribed" | "waiting" | "suspended";

export const ADMIN_STATUS_LABEL: Record<AdminStatus, string> = {
  trial: "Em teste",
  subscribed: "Assinante",
  waiting: "Modo de espera",
  suspended: "Suspenso",
};

/** Where a business stands for the admin (suspension first, then the plan). */
export function adminStatus(
  business: Pick<Business, "plan" | "trial_ends_at" | "suspended_at">,
  now = new Date(),
): AdminStatus {
  if (business.suspended_at) return "suspended";
  if (business.plan === "complete") return "subscribed";
  if (business.trial_ends_at && new Date(business.trial_ends_at) > now) return "trial";
  return "waiting";
}

/** Counts per day for the last `days` days (oldest first), by the given day key ("YYYY-MM-DD"). */
export function dailyCounts(
  dayKeys: string[],
  days: number,
  today: string,
): { day: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const key of dayKeys) counts.set(key, (counts.get(key) ?? 0) + 1);
  const end = new Date(`${today}T12:00:00Z`);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    const day = d.toISOString().slice(0, 10);
    return { day, count: counts.get(day) ?? 0 };
  });
}

export interface AdminOverview {
  mrrCents: number;
  arrCents: number;
  /** Average monthly revenue per paying business. */
  arpaCents: number;
  byStatus: Record<AdminStatus, number>;
  signups7: number;
  signups30: number;
  /** Paid subscriptions cancelled in the last 30 days (share of the paying base). */
  churn30: { cancelled: number; rate: number };
  trialConversion: { finished: number; paid: number };
}

export function computeOverview(
  businesses: Pick<
    Business,
    "id" | "created_at" | "plan" | "trial_started_at" | "trial_ends_at" | "suspended_at"
  >[],
  subscriptions: (Pick<
    Subscription,
    "business_id" | "plan" | "billing_cycle" | "status" | "addons" | "extra_professionals"
  > & { updated_at?: string | null })[],
  now = new Date(),
): AdminOverview {
  const since = (days: number) => now.getTime() - days * 86_400_000;
  const byStatus: Record<AdminStatus, number> = {
    trial: 0,
    subscribed: 0,
    waiting: 0,
    suspended: 0,
  };
  for (const b of businesses) byStatus[adminStatus(b, now)]++;
  const paying = subscriptions.filter((s) => s.status === "active" || s.status === "overdue");
  const mrrCents = paying.reduce((sum, s) => sum + monthlyRevenue(s), 0);
  const cancelled = subscriptions.filter(
    (s) =>
      s.status === "cancelled" && s.updated_at && new Date(s.updated_at).getTime() >= since(30),
  ).length;
  const base = paying.length + cancelled;
  return {
    mrrCents,
    arrCents: mrrCents * 12,
    arpaCents: paying.length ? Math.round(mrrCents / paying.length) : 0,
    byStatus,
    signups7: businesses.filter((b) => new Date(b.created_at).getTime() >= since(7)).length,
    signups30: businesses.filter((b) => new Date(b.created_at).getTime() >= since(30)).length,
    churn30: { cancelled, rate: base ? cancelled / base : 0 },
    trialConversion: conversion(businesses, now),
  };
}
