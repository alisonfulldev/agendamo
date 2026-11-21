import { describe, expect, it } from "vitest";

import { LEGACY_TRIAL_DAYS, TRIAL_DAYS, trialDaysAt } from "./plans";
import { LEGACY_LINK_BONUS_DAYS, LINK_BONUS_DAYS, linkBonusDays } from "./trial-bonus-shared";

describe("shorter trial from 2026-11-22 (Brasília)", () => {
  it("keeps 14 days for trials started up to 2026-11-21 23:59 in Brasília", () => {
    expect(LEGACY_TRIAL_DAYS).toBe(14);
    expect(trialDaysAt(new Date("2026-11-21T12:00:00Z"))).toBe(14);
    expect(trialDaysAt(new Date("2026-11-22T02:59:59Z"))).toBe(14);
  });

  it("gives 3 days from 2026-11-22 00:00 in Brasília", () => {
    expect(TRIAL_DAYS).toBe(3);
    expect(trialDaysAt(new Date("2026-11-22T03:00:00Z"))).toBe(3);
    expect(trialDaysAt(new Date("2026-12-01T12:00:00Z"))).toBe(3);
  });

  it("link bonus: +7 on the old trials, +2 on the short ones", () => {
    expect(LEGACY_LINK_BONUS_DAYS).toBe(7);
    expect(LINK_BONUS_DAYS).toBe(2);
    expect(linkBonusDays("2026-11-10T15:00:00Z")).toBe(7);
    expect(linkBonusDays("2026-11-22T03:00:00Z")).toBe(2);
    expect(linkBonusDays(null)).toBe(2);
  });
});
