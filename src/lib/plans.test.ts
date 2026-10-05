import { describe, expect, it } from "vitest";

import { getPlanFeatures, subscriptionPrice, yearlySavings, PRICE_TEXT } from "@/lib/plans";

const NOW = new Date("2030-01-15T12:00:00Z");

describe("getPlanFeatures (single plan)", () => {
  it("trial: everything on, 10 professionals, days left counted", () => {
    const f = getPlanFeatures(
      {
        plan: "free",
        trial_started_at: "2030-01-01T00:00:00Z",
        trial_ends_at: "2030-01-31T00:00:00Z",
      },
      NOW,
    );
    expect(f).toMatchObject({
      status: "trial",
      active: true,
      chatBooking: true,
      finance: true,
      anyProfessional: true,
      removeBranding: false,
      professionalLimit: 10,
      trialDaysLeft: 15,
    });
  });

  it("trial ended without subscription: expired, chat hands off to WhatsApp", () => {
    const f = getPlanFeatures(
      {
        plan: "free",
        trial_started_at: "2029-12-01T00:00:00Z",
        trial_ends_at: "2029-12-31T00:00:00Z",
      },
      NOW,
    );
    expect(f).toMatchObject({
      status: "expired",
      active: false,
      chatBooking: false,
      agenda: false,
      finance: false,
      trialDaysLeft: null,
    });
  });

  it("subscribed: everything on, professionals limited to the paid seats", () => {
    const f = getPlanFeatures(
      {
        plan: "pro",
        trial_started_at: "2029-12-01T00:00:00Z",
        trial_ends_at: "2029-12-31T00:00:00Z",
        professional_seats: 3,
      },
      NOW,
    );
    expect(f).toMatchObject({
      status: "subscribed",
      active: true,
      removeBranding: true,
      professionalLimit: 3,
      photoLimit: 60,
    });
  });

  it("legacy team counts as subscribed", () => {
    const f = getPlanFeatures(
      { plan: "team", trial_started_at: null, trial_ends_at: null, professional_seats: 5 },
      NOW,
    );
    expect(f).toMatchObject({ status: "subscribed", professionalLimit: 5 });
  });
});

describe("prices", () => {
  it("R$ 19/month or R$ 192/year, R$ 9 (R$ 90/year) per extra professional", () => {
    expect(subscriptionPrice("monthly", 0)).toBe(1900);
    expect(subscriptionPrice("yearly", 0)).toBe(19200);
    expect(subscriptionPrice("monthly", 2)).toBe(1900 + 1800);
    expect(subscriptionPrice("yearly", 2)).toBe(19200 + 18000);
    expect(subscriptionPrice("monthly", 0, 50)).toBe(950);
  });

  it("yearly saves R$ 36 for one professional", () => {
    expect(yearlySavings(0)).toBe(3600);
    expect(yearlySavings(1)).toBe(3600 + (900 * 12 - 9000));
  });

  it("copy prices come from the price table", () => {
    expect(PRICE_TEXT.summary).toBe("R$ 19/mês ou R$ 192/ano (sai R$ 16/mês)");
    expect(PRICE_TEXT.extraProfessional).toBe("R$ 9/mês");
  });
});
