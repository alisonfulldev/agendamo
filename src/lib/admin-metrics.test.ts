import { describe, expect, it } from "vitest";

import {
  adminStatus,
  computeDepositMetrics,
  computeMetrics,
  computeOverview,
  dailyCounts,
  monthlyRevenue,
  weekOf,
} from "@/lib/admin-metrics";

describe("monthlyRevenue", () => {
  it("uses the plan's price, normalizes yearly plans and adds active add-ons", () => {
    const sub = {
      plan: "complete" as const,
      billing_cycle: "monthly" as const,
      status: "active" as const,
      addons: {},
      extra_professionals: 0,
    };
    expect(monthlyRevenue(sub)).toBe(2390);
    expect(monthlyRevenue({ ...sub, billing_cycle: "yearly" })).toBe(1990);
    expect(
      monthlyRevenue({
        ...sub,
        extra_professionals: 2,
        addons: {
          featured: [
            { city: "A", subscription_id: "1", status: "active" },
            { city: "B", subscription_id: "2", status: "cancelled" },
          ],
        },
      }),
    ).toBe(2390 + 2 * 900 + 4900);
    expect(monthlyRevenue({ ...sub, status: "cancelled" })).toBe(0);
  });
});

describe("computeMetrics", () => {
  const now = new Date("2030-01-16T12:00:00Z"); // Wednesday
  const base = { trial_started_at: null, trial_ends_at: null };
  const activeSub = {
    plan: "complete" as const,
    billing_cycle: "monthly" as const,
    status: "active" as const,
    addons: {},
    extra_professionals: 0,
  };

  it("counts signups per week, trials, subscribers and MRR", () => {
    const metrics = computeMetrics(
      [
        {
          ...base,
          id: "a",
          plan: "free",
          created_at: "2030-01-14T10:00:00Z",
          trial_started_at: "2030-01-14T10:00:00Z",
          trial_ends_at: "2030-01-28T10:00:00Z",
        },
        { ...base, id: "b", plan: "complete", created_at: "2030-01-08T10:00:00Z" },
      ],
      [{ ...activeSub, business_id: "b" }],
      new Set(["a"]),
      now,
      2,
    );
    expect(weekOf("2030-01-16T12:00:00Z")).toBe("2030-01-14");
    expect(metrics.signupsByWeek).toEqual([
      { week: "2030-01-07", count: 1 },
      { week: "2030-01-14", count: 1 },
    ]);
    expect(metrics).toMatchObject({
      businesses: 2,
      activated: 1,
      trials: 1,
      activeTrials: 1,
      subscribers: 1,
      mrrCents: 2390,
      waiting: 0,
    });
  });

  it("trial conversion and accounts in waiting mode", () => {
    const started = "2029-12-20T00:00:00Z";
    const ended = "2030-01-03T00:00:00Z";
    const metrics = computeMetrics(
      [
        // Trial ended without paying: waiting mode.
        {
          id: "a",
          plan: "free",
          created_at: started,
          trial_started_at: started,
          trial_ends_at: ended,
        },
        // Trial converted.
        {
          id: "b",
          plan: "complete",
          created_at: started,
          trial_started_at: started,
          trial_ends_at: ended,
        },
        // Trial still running: not finished yet.
        {
          id: "c",
          plan: "free",
          created_at: started,
          trial_started_at: "2030-01-10T00:00:00Z",
          trial_ends_at: "2030-01-24T00:00:00Z",
        },
        // Subscription ended without payment (no trial): waiting mode too.
        { ...base, id: "d", plan: "free", created_at: started },
      ],
      [{ ...activeSub, business_id: "d", status: "cancelled" }],
      new Set(),
      now,
      2,
    );
    expect(metrics.trialConversion).toEqual({ finished: 2, paid: 1 });
    expect(metrics.waiting).toBe(2);
  });
});

describe("computeDepositMetrics", () => {
  it("counts deposits, the receipt rate, the time to decide and the outcomes", () => {
    const sent = "2030-01-10T10:00:00Z";
    const m = computeDepositMetrics(
      [
        {
          deposit_status: "confirmed",
          deposit_sent_at: sent,
          deposit_decided_at: "2030-01-10T10:30:00Z",
        },
        {
          deposit_status: "refused",
          deposit_sent_at: sent,
          deposit_decided_at: "2030-01-10T11:30:00Z",
        },
        {
          deposit_status: "expired",
          deposit_sent_at: null,
          deposit_decided_at: "2030-01-10T10:20:00Z",
        },
        { deposit_status: "sent", deposit_sent_at: sent, deposit_decided_at: null },
        { deposit_status: "none", deposit_sent_at: null, deposit_decided_at: null },
      ],
      2,
    );
    expect(m).toEqual({
      withDeposit: 4,
      receiptRate: 0.75,
      avgMinutesToDecision: 60,
      confirmed: 1,
      refused: 1,
      expired: 1,
      duplicatesBlocked: 2,
    });
  });
});

describe("admin panel helpers", () => {
  const now = new Date("2030-01-16T12:00:00Z");
  const business = (over: Partial<Parameters<typeof adminStatus>[0]> = {}) => ({
    plan: "free" as const,
    trial_ends_at: null,
    suspended_at: null,
    ...over,
  });

  it("adminStatus: suspended first, then subscribed, trial and waiting mode", () => {
    expect(
      adminStatus(business({ suspended_at: "2030-01-01T00:00:00Z", plan: "complete" }), now),
    ).toBe("suspended");
    expect(adminStatus(business({ plan: "complete" }), now)).toBe("subscribed");
    expect(adminStatus(business({ trial_ends_at: "2030-01-20T00:00:00Z" }), now)).toBe("trial");
    expect(adminStatus(business({ trial_ends_at: "2030-01-10T00:00:00Z" }), now)).toBe("waiting");
    expect(adminStatus(business(), now)).toBe("waiting");
  });

  it("dailyCounts: one bucket per day, oldest first, zeros included", () => {
    expect(dailyCounts(["2030-01-16", "2030-01-16", "2030-01-14"], 3, "2030-01-16")).toEqual([
      { day: "2030-01-14", count: 1 },
      { day: "2030-01-15", count: 0 },
      { day: "2030-01-16", count: 2 },
    ]);
  });

  it("computeOverview: MRR, ARR, ticket, situations, sign-ups and churn", () => {
    const sub = {
      plan: "complete" as const,
      billing_cycle: "monthly" as const,
      addons: {},
      extra_professionals: 0,
    };
    const overview = computeOverview(
      [
        {
          id: "a",
          created_at: "2030-01-15T00:00:00Z",
          plan: "complete",
          trial_started_at: null,
          trial_ends_at: null,
          suspended_at: null,
        },
        {
          id: "b",
          created_at: "2030-01-01T00:00:00Z",
          plan: "free",
          trial_started_at: "2030-01-01T00:00:00Z",
          trial_ends_at: "2030-01-20T00:00:00Z",
          suspended_at: null,
        },
        {
          id: "c",
          created_at: "2029-11-01T00:00:00Z",
          plan: "free",
          trial_started_at: null,
          trial_ends_at: null,
          suspended_at: null,
        },
      ],
      [
        { ...sub, business_id: "a", status: "active" },
        { ...sub, business_id: "c", status: "cancelled", updated_at: "2030-01-10T00:00:00Z" },
      ],
      now,
    );
    expect(overview).toMatchObject({
      mrrCents: 2390,
      arrCents: 2390 * 12,
      arpaCents: 2390,
      byStatus: { subscribed: 1, trial: 1, waiting: 1, suspended: 0 },
      signups7: 1,
      signups30: 2,
      churn30: { cancelled: 1, rate: 0.5 },
    });
  });
});
