import { describe, expect, it } from "vitest";

import { computeMetrics, monthlyRevenue, weekOf } from "@/lib/admin-metrics";

describe("monthlyRevenue", () => {
  it("normalizes yearly plans and adds active add-ons", () => {
    expect(
      monthlyRevenue({
        plan: "pro",
        billing_cycle: "monthly",
        status: "active",
        addons: {},
        extra_professionals: 0,
      }),
    ).toBe(1900);
    expect(
      monthlyRevenue({
        plan: "pro",
        billing_cycle: "yearly",
        status: "active",
        addons: {},
        extra_professionals: 0,
      }),
    ).toBe(1600);
    expect(
      monthlyRevenue({
        plan: "pro",
        billing_cycle: "monthly",
        status: "active",
        extra_professionals: 2,
        addons: {
          featured: [
            { city: "A", subscription_id: "1", status: "active" },
            { city: "B", subscription_id: "2", status: "cancelled" },
          ],
        },
      }),
    ).toBe(1900 + 2 * 900 + 4900);
    expect(
      monthlyRevenue({
        plan: "pro",
        billing_cycle: "monthly",
        status: "cancelled",
        addons: {},
        extra_professionals: 0,
      }),
    ).toBe(0);
  });
});

describe("computeMetrics", () => {
  it("counts signups per week, trials, subscribers and MRR", () => {
    const now = new Date("2030-01-16T12:00:00Z"); // Wednesday
    const metrics = computeMetrics(
      [
        {
          id: "a",
          created_at: "2030-01-14T10:00:00Z",
          trial_started_at: "2030-01-14T10:00:00Z",
          trial_ends_at: "2030-02-13T10:00:00Z",
        },
        {
          id: "b",
          created_at: "2030-01-08T10:00:00Z",
          trial_started_at: null,
          trial_ends_at: null,
        },
      ],
      [
        {
          business_id: "b",
          plan: "pro",
          billing_cycle: "monthly",
          status: "active",
          addons: {},
          extra_professionals: 0,
        },
      ],
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
      mrrCents: 1900,
    });
  });
});
