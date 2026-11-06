import { describe, expect, it } from "vitest";

import {
  getPlanFeatures,
  planLabel,
  PRICE_TEXT,
  subscriptionPrice,
  TRIAL_DAYS,
  yearlySavings,
} from "@/lib/plans";

const NOW = new Date("2030-01-15T12:00:00Z");
const DAY = 86_400_000;

describe("getPlanFeatures (Completo, 14-day trial, waiting mode)", () => {
  it("trial: everything works, no brand footer, days counted, up to 10 professionals", () => {
    const f = getPlanFeatures(
      {
        plan: "free",
        trial_started_at: new Date(NOW.getTime() - 4 * DAY).toISOString(),
        trial_ends_at: new Date(NOW.getTime() + 10 * DAY).toISOString(),
      },
      NOW,
    );
    expect(f).toMatchObject({
      status: "trial",
      active: true,
      trialActive: true,
      subscribed: false,
      trialDaysLeft: 10,
      discreetBadge: true,
      reminders: true,
      embed: true,
      finance: true,
      deposits: true,
      professionalLimit: 10,
    });
    expect(planLabel(f)).toBe("Teste grátis");
  });

  it("last day of the trial counts as 1 day left", () => {
    const f = getPlanFeatures(
      {
        plan: "free",
        trial_started_at: new Date(NOW.getTime() - 13.5 * DAY).toISOString(),
        trial_ends_at: new Date(NOW.getTime() + 0.5 * DAY).toISOString(),
      },
      NOW,
    );
    expect(f.trialDaysLeft).toBe(1);
  });

  it("waiting mode after the trial: nothing active, brand footer, 1 professional", () => {
    const f = getPlanFeatures(
      {
        plan: "free",
        trial_started_at: new Date(NOW.getTime() - 20 * DAY).toISOString(),
        trial_ends_at: new Date(NOW.getTime() - 6 * DAY).toISOString(),
      },
      NOW,
    );
    expect(f).toMatchObject({
      status: "waiting",
      active: false,
      trialActive: false,
      discreetBadge: false,
      reminders: false,
      customers: false,
      deposits: false,
      professionalLimit: 1,
      trialDaysLeft: null,
    });
    expect(planLabel(f)).toBe("Assinatura pendente");
  });

  it("no trial at all (trial already used by this person) is waiting mode too", () => {
    const f = getPlanFeatures({ plan: "free", trial_ends_at: null }, NOW);
    expect(f.status).toBe("waiting");
    expect(f.active).toBe(false);
  });

  it("subscribed: everything, paid seats, the trial no longer matters", () => {
    const f = getPlanFeatures(
      {
        plan: "complete",
        trial_ends_at: new Date(NOW.getTime() + 3 * DAY).toISOString(),
        professional_seats: 3,
      },
      NOW,
    );
    expect(f).toMatchObject({
      status: "subscribed",
      active: true,
      subscribed: true,
      trialActive: false,
      discreetBadge: true,
      professionalLimit: 3,
    });
    expect(planLabel(f)).toBe("Completo");
  });
});

describe("prices", () => {
  it("Completo: R$ 23,90/month or R$ 19,90/month on the yearly plan", () => {
    expect(subscriptionPrice("monthly", 0)).toBe(2390);
    expect(subscriptionPrice("yearly", 0)).toBe(23880);
    expect(PRICE_TEXT.summary).toBe("R$ 23,90/mês ou R$ 19,90/mês no anual");
  });

  it("extra professionals and coupons", () => {
    expect(subscriptionPrice("monthly", 2)).toBe(2390 + 1800);
    expect(subscriptionPrice("yearly", 1)).toBe(23880 + 9000);
    expect(subscriptionPrice("monthly", 0, 50)).toBe(1195);
  });

  it("yearly savings shown on the site", () => {
    expect(yearlySavings()).toBe(2390 * 12 - 23880);
    expect(PRICE_TEXT.yearlySavings).toBe("economize R$ 48 por ano");
  });

  it("trial copy uses the 14 days", () => {
    expect(TRIAL_DAYS).toBe(14);
    expect(PRICE_TEXT.trial).toBe("14 dias grátis, sem cartão");
  });
});

describe("Site + Agenda (2026-11-05)", () => {
  const now = new Date("2026-11-05T12:00:00Z");
  it("the site is on in the trial and on the Site + Agenda plan, off on Completo and in waiting", async () => {
    const { getPlanFeatures } = await import("./plans");
    const trial = { plan: "free" as const, trial_ends_at: "2026-11-10T00:00:00Z" };
    expect(getPlanFeatures(trial, now).site).toBe(true);
    expect(
      getPlanFeatures({ plan: "complete", trial_ends_at: null, plan_tier: "site" }, now).site,
    ).toBe(true);
    expect(
      getPlanFeatures({ plan: "complete", trial_ends_at: null, plan_tier: "complete" }, now).site,
    ).toBe(false);
    expect(getPlanFeatures({ plan: "complete", trial_ends_at: null }, now).site).toBe(false);
    expect(
      getPlanFeatures(
        { plan: "free", trial_ends_at: "2026-11-01T00:00:00Z", plan_tier: "site" },
        now,
      ).site,
    ).toBe(false);
  });

  it("prices: R$ 39/month or R$ 390/year, extras on top, coupon applies", async () => {
    const { subscriptionPrice, yearlySavings, planLabel, getPlanFeatures } =
      await import("./plans");
    expect(subscriptionPrice("monthly", 0, 0, "site")).toBe(3900);
    expect(subscriptionPrice("yearly", 0, 0, "site")).toBe(39_000);
    expect(subscriptionPrice("monthly", 1, 0, "site")).toBe(4800);
    expect(subscriptionPrice("monthly", 0, 10, "site")).toBe(3510);
    expect(yearlySavings(0, "site")).toBe(7800);
    expect(
      planLabel(getPlanFeatures({ plan: "complete", trial_ends_at: null, plan_tier: "site" }, now)),
    ).toBe("Site + Agenda");
  });
});
