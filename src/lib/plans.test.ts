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
      removeBranding: true,
      reminders: true,
      embed: true,
      finance: true,
      deposits: true,
      professionalLimit: 10,
    });
    expect(planLabel(f)).toBe("Teste do Completo");
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
      removeBranding: false,
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
      removeBranding: true,
      professionalLimit: 3,
    });
    expect(planLabel(f)).toBe("Completo");
  });
});

describe("prices", () => {
  it("Completo: R$ 29,90/month or R$ 24,90/month on the yearly plan", () => {
    expect(subscriptionPrice("monthly", 0)).toBe(2990);
    expect(subscriptionPrice("yearly", 0)).toBe(29880);
    expect(PRICE_TEXT.summary).toBe("R$ 29,90/mês ou R$ 24,90/mês no anual");
  });

  it("extra professionals and coupons", () => {
    expect(subscriptionPrice("monthly", 2)).toBe(2990 + 1800);
    expect(subscriptionPrice("yearly", 1)).toBe(29880 + 9000);
    expect(subscriptionPrice("monthly", 0, 50)).toBe(1495);
  });

  it("yearly savings shown on the site", () => {
    expect(yearlySavings()).toBe(2990 * 12 - 29880);
    expect(PRICE_TEXT.yearlySavings).toBe("economize R$ 60 por ano");
  });

  it("trial copy uses the 14 days", () => {
    expect(TRIAL_DAYS).toBe(14);
    expect(PRICE_TEXT.trial).toBe("14 dias grátis, sem cartão");
    expect(PRICE_TEXT.noCard).toContain("14 dias");
  });
});
