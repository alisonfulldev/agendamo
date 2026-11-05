import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { nextTip, tipCopy, type TipFacts, type TipKey } from "./usage-tips";

const base: TipFacts = {
  daysIn: 1,
  daysLeft: 13,
  customerViews: 0,
  weekViews: 0,
  chatBookings: 0,
  pushOn: false,
  pushPossible: true,
  missing: ["foto do perfil"],
  bonuses: 0,
};

describe("trial incentive tips (2026-11-05)", () => {
  it("goes in order, one at a time, only from its day", () => {
    expect(nextTip({ ...base, daysIn: 0 }, new Set())?.key).toBeUndefined();
    expect(nextTip(base, new Set())?.key).toBe("link");
    expect(nextTip(base, new Set<TipKey>(["link"]))).toBeNull();
    expect(nextTip({ ...base, daysIn: 2 }, new Set<TipKey>(["link"]))?.key).toBe("app");
  });

  it("skips what the owner already did", () => {
    const done = {
      ...base,
      daysIn: 7,
      customerViews: 9,
      pushOn: true,
      missing: [],
      chatBookings: 2,
    };
    expect(nextTip(done, new Set())?.key).toBe("week");
    // No push keys on the server: the app tip waits.
    expect(
      nextTip({ ...base, daysIn: 2, pushPossible: false }, new Set<TipKey>(["link"])),
    ).toBeNull();
  });

  it("an account already in the trial picks up one tip per day", () => {
    const late = { ...base, daysIn: 8, daysLeft: 6 };
    expect(nextTip(late, new Set())?.key).toBe("link");
    expect(nextTip(late, new Set<TipKey>(["link", "app"]))?.key).toBe("profile");
  });

  it("leaves the last days to the trial notices", () => {
    expect(nextTip({ ...base, daysLeft: 5 }, new Set())).toBeNull();
  });

  it("never shows a visit count under 5 (rule 5)", () => {
    const ctx = { customers: "pacientes", link: "https://meetchat.com.br/x" };
    expect(tipCopy("week", { ...base, weekViews: 4 }, ctx).paragraphs.join(" ")).not.toMatch(
      /4 visitas/,
    );
    expect(tipCopy("week", { ...base, weekViews: 12 }, ctx).paragraphs[0]).toContain("12 visitas");
    expect(tipCopy("share", base, ctx).subject).toBe("Mande seu link para 5 pacientes hoje");
  });
});
