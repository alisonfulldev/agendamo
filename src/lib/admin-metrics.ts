import type { Business, Subscription } from "@/lib/db/types";
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
}

/** ISO Monday (UTC) of a timestamp, "YYYY-MM-DD". */
export function weekOf(iso: string): string {
  const d = new Date(iso);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

export function computeMetrics(
  businesses: Pick<Business, "id" | "created_at" | "trial_started_at" | "trial_ends_at">[],
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
  };
}

/** ISO timestamp of days days ago (kept out of render functions). */
export function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}
