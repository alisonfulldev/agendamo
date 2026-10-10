import { describe, expect, it } from "vitest";

import { computeMetrics, monthlyRevenue, weekOf } from "@/lib/admin-metrics";

describe("monthlyRevenue", () => {
  it("uses the plan's price, normalizes yearly plans and adds active add-ons", () => {
    expect(
      monthlyRevenue({
        plan: "agenda",
        billing_cycle: "monthly",
        status: "active",
        addons: {},
        extra_professionals: 0,
      }),
    ).toBe(1990);
    expect(
      monthlyRevenue({
        plan: "pro",
        billing_cycle: "yearly",
        status: "active",
        addons: {},
        extra_professionals: 0,
      }),
    ).toBe(2990);
    expect(
      monthlyRevenue({
        plan: "agenda",
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
    ).toBe(1990 + 2 * 900 + 4900);
    expect(
      monthlyRevenue({
        plan: "agenda",
        billing_cycle: "monthly",
        status: "cancelled",
        addons: {},
        extra_professionals: 0,
      }),
    ).toBe(0);
  });
});

describe("computeMetrics", () => {
  const now = new Date("2030-01-16T12:00:00Z"); // Wednesday
  const base = {
    trial_plan: null,
    trial_started_at: null,
    trial_ends_at: null,
    signup_choice: null,
  };

  it("counts signups per week, trials, subscribers and MRR", () => {
    const metrics = computeMetrics(
      [
        {
          ...base,
          id: "a",
          plan: "free",
          created_at: "2030-01-14T10:00:00Z",
          trial_plan: "agenda",
          trial_started_at: "2030-01-14T10:00:00Z",
          trial_ends_at: "2030-01-21T10:00:00Z",
          signup_choice: "trial_agenda",
        },
        {
          ...base,
          id: "b",
          plan: "agenda",
          created_at: "2030-01-08T10:00:00Z",
          signup_choice: "free",
        },
      ],
      [
        {
          business_id: "b",
          plan: "agenda",
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
      mrrCents: 1990,
      signupsByChoice: { free: 1, trialAgenda: 1, trialPro: 0 },
    });
  });

  it("trial conversion per plan, accounts that fell to Grátis and upgrades", () => {
    const ended = "2030-01-10T00:00:00Z";
    const metrics = computeMetrics(
      [
        // Pro trial ended without paying: fell to Grátis.
        {
          ...base,
          id: "a",
          plan: "free",
          created_at: ended,
          trial_plan: "pro",
          trial_ends_at: ended,
        },
        // Pro trial converted.
        {
          ...base,
          id: "b",
          plan: "pro",
          created_at: ended,
          trial_plan: "pro",
          trial_ends_at: ended,
        },
        // Agenda trial still running: not finished yet.
        {
          ...base,
          id: "c",
          plan: "free",
          created_at: ended,
          trial_plan: "agenda",
          trial_ends_at: "2030-01-20T00:00:00Z",
        },
        // Cancelled subscription, back on Grátis.
        { ...base, id: "d", plan: "free", created_at: ended },
      ],
      [
        {
          business_id: "d",
          plan: "agenda",
          billing_cycle: "monthly",
          status: "cancelled",
          addons: {},
          extra_professionals: 0,
        },
      ],
      new Set(),
      now,
      2,
      new Set(["b"]),
    );
    expect(metrics.trialConversion).toEqual({
      agenda: { finished: 0, paid: 0 },
      pro: { finished: 2, paid: 1 },
    });
    expect(metrics.fellToFree).toBe(2);
    expect(metrics.upgrades).toBe(1);
  });
});
