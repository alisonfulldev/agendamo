import { describe, expect, it } from "vitest";

import { allowanceFrom, freeCycle } from "@/lib/plan-cycle";

const SP = "America/Sao_Paulo";

describe("freeCycle (Grátis: 30 days from the sign-up date)", () => {
  it("first cycle starts at local midnight of the sign-up day", () => {
    const c = freeCycle("2030-03-10T15:00:00Z", SP, new Date("2030-03-20T12:00:00Z"));
    expect(c.startDate).toBe("2030-03-10");
    expect(c.endDate).toBe("2030-04-09");
    expect(c.start.toISOString()).toBe("2030-03-10T03:00:00.000Z");
    expect(c.end.toISOString()).toBe("2030-04-09T03:00:00.000Z");
  });

  it("renews every 30 days", () => {
    const c = freeCycle("2030-03-10T15:00:00Z", SP, new Date("2030-04-09T03:00:00Z"));
    expect(c.startDate).toBe("2030-04-09");
    expect(c.endDate).toBe("2030-05-09");
    const later = freeCycle("2030-03-10T15:00:00Z", SP, new Date("2030-06-01T12:00:00Z"));
    expect(later.startDate).toBe("2030-05-09");
  });

  it("the last minute of a cycle is still in it (local time)", () => {
    // 2030-04-08 23:59 in São Paulo = 2030-04-09 02:59 UTC.
    const c = freeCycle("2030-03-10T15:00:00Z", SP, new Date("2030-04-09T02:59:00Z"));
    expect(c.startDate).toBe("2030-03-10");
  });

  it("uses the business timezone for the sign-up day", () => {
    // 01:30 UTC on the 11th is still the 10th in São Paulo, but the 11th in Lisbon.
    const createdAt = "2030-03-11T01:30:00Z";
    const now = new Date("2030-03-15T12:00:00Z");
    expect(freeCycle(createdAt, SP, now).startDate).toBe("2030-03-10");
    expect(freeCycle(createdAt, "Europe/Lisbon", now).startDate).toBe("2030-03-11");
  });

  it("works across a timezone with daylight saving time", () => {
    const c = freeCycle(
      "2030-03-01T12:00:00Z",
      "America/New_York",
      new Date("2030-03-20T12:00:00Z"),
    );
    expect(c.start.toISOString()).toBe("2030-03-01T05:00:00.000Z");
    // 2030-03-31 local midnight is after the DST change (UTC-4).
    expect(c.end.toISOString()).toBe("2030-03-31T04:00:00.000Z");
  });
});

describe("allowanceFrom", () => {
  const cycle = freeCycle("2030-03-10T15:00:00Z", SP, new Date("2030-03-20T12:00:00Z"));
  it("counts what is left of the 10", () => {
    expect(allowanceFrom(3, cycle)).toMatchObject({
      limited: true,
      used: 3,
      limit: 10,
      remaining: 7,
    });
  });
  it("never goes below zero", () => {
    expect(allowanceFrom(12, cycle).remaining).toBe(0);
  });
});
