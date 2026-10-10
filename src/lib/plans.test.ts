import { describe, expect, it } from "vitest";

import {
  getPlanFeatures,
  paidPlanOf,
  planLabel,
  PRICE_TEXT,
  subscriptionPrice,
  yearlySavings,
} from "@/lib/plans";

const NOW = new Date("2030-01-15T12:00:00Z");
const DAY = 86_400_000;

describe("getPlanFeatures (Grátis, Agenda, Pro)", () => {
  it("Grátis (never tested): limited chat bookings, only chat and agenda, brand footer", () => {
    const f = getPlanFeatures({ plan: "free", trial_plan: null, trial_ends_at: null }, NOW);
    expect(f).toMatchObject({
      tier: "free",
      status: "free",
      subscribed: false,
      limitedBookings: true,
      agenda: true,
      reminders: false,
      removeBranding: false,
      embed: false,
      customers: false,
      finance: false,
      salesTools: false,
      googleCalendar: false,
      anyProfessional: false,
      deposits: false,
      trialAvailable: true,
      professionalLimit: 1,
    });
    expect(planLabel(f)).toBe("Grátis");
  });

  it("trial of Agenda: everything of Agenda, no limit, days counted", () => {
    const f = getPlanFeatures(
      {
        plan: "free",
        trial_plan: "agenda",
        trial_started_at: new Date(NOW.getTime() - 2 * DAY).toISOString(),
        trial_ends_at: new Date(NOW.getTime() + 5 * DAY).toISOString(),
      },
      NOW,
    );
    expect(f).toMatchObject({
      tier: "agenda",
      status: "trial",
      trialActive: true,
      limitedBookings: false,
      reminders: true,
      embed: true,
      finance: true,
      removeBranding: false,
      trialAvailable: false,
      trialDaysLeft: 5,
      professionalLimit: 10,
    });
    expect(planLabel(f)).toBe("Teste do Agenda");
  });

  it("trial ended without payment: back to Grátis (limited), trial no longer available", () => {
    const f = getPlanFeatures(
      {
        plan: "free",
        trial_plan: "pro",
        trial_started_at: new Date(NOW.getTime() - 8 * DAY).toISOString(),
        trial_ends_at: new Date(NOW.getTime() - DAY).toISOString(),
      },
      NOW,
    );
    expect(f).toMatchObject({
      tier: "free",
      status: "free",
      trialActive: false,
      trialAvailable: false,
      limitedBookings: true,
      finance: false,
      trialDaysLeft: null,
    });
  });

  it("subscribed to Agenda: unlimited, no counter, paid seats", () => {
    const f = getPlanFeatures({ plan: "agenda", trial_ends_at: null, professional_seats: 3 }, NOW);
    expect(f).toMatchObject({
      tier: "agenda",
      status: "subscribed",
      limitedBookings: false,
      removeBranding: false,
      professionalLimit: 3,
      deposits: false,
    });
  });

  it("Pro: deposits stay off until their own step (DEPOSITS_ENABLED)", () => {
    const f = getPlanFeatures({ plan: "pro", trial_ends_at: null }, NOW);
    expect(f).toMatchObject({ tier: "pro", status: "subscribed", deposits: false });
  });

  it("subscribing during a trial applies right away (plan wins over the trial)", () => {
    const f = getPlanFeatures(
      {
        plan: "pro",
        trial_plan: "agenda",
        trial_ends_at: new Date(NOW.getTime() + 3 * DAY).toISOString(),
      },
      NOW,
    );
    expect(f).toMatchObject({ tier: "pro", status: "subscribed", trialActive: false });
  });

  it("legacy team counts as Pro", () => {
    expect(paidPlanOf("team")).toBe("pro");
    const f = getPlanFeatures({ plan: "team", trial_ends_at: null, professional_seats: 5 }, NOW);
    expect(f).toMatchObject({ tier: "pro", status: "subscribed", professionalLimit: 5 });
  });
});

describe("prices", () => {
  it("Agenda R$ 19,90 or R$ 14,90/month yearly; Pro R$ 39,90 or R$ 29,90/month yearly", () => {
    expect(subscriptionPrice("agenda", "monthly", 0)).toBe(1990);
    expect(subscriptionPrice("agenda", "yearly", 0)).toBe(17880);
    expect(subscriptionPrice("pro", "monthly", 0)).toBe(3990);
    expect(subscriptionPrice("pro", "yearly", 0)).toBe(35880);
  });

  it("R$ 9 (R$ 90/year) per extra professional, coupons in percent", () => {
    expect(subscriptionPrice("agenda", "monthly", 2)).toBe(1990 + 1800);
    expect(subscriptionPrice("pro", "yearly", 1)).toBe(35880 + 9000);
    expect(subscriptionPrice("agenda", "monthly", 0, 50)).toBe(995);
  });

  it("yearly savings", () => {
    expect(yearlySavings("agenda")).toBe(1990 * 12 - 17880);
    expect(yearlySavings("pro")).toBe(3990 * 12 - 35880);
  });

  it("copy prices come from the price table", () => {
    expect(PRICE_TEXT.agenda.monthly).toBe("R$ 19,90/mês");
    expect(PRICE_TEXT.agenda.yearlyPerMonth).toBe("R$ 14,90/mês");
    expect(PRICE_TEXT.pro.yearlyPerMonth).toBe("R$ 29,90/mês");
    expect(PRICE_TEXT.extraProfessional).toBe("R$ 9/mês");
    expect(PRICE_TEXT.free).toBe("Grátis para sempre com 10 agendamentos por mês");
  });
});
