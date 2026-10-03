import { describe, expect, it } from "vitest";

import { displayCount, sumWeek, weekStart, type DailyStats } from "@/lib/stats";

describe("displayCount", () => {
  it("never shows aggregates below 5", () => {
    expect(displayCount(0)).toBe("0");
    expect(displayCount(1)).toBe("menos de 5");
    expect(displayCount(4)).toBe("menos de 5");
    expect(displayCount(5)).toBe("5");
    expect(displayCount(1234)).toBe("1.234");
  });
});

describe("weekStart", () => {
  it("returns Monday in the business timezone", () => {
    // Sunday 2030-01-13 23:30 in São Paulo = Monday 02:30 UTC.
    expect(weekStart(new Date("2030-01-14T02:30:00Z"), "America/Sao_Paulo")).toBe("2030-01-07");
    expect(weekStart(new Date("2030-01-14T12:00:00Z"), "America/Sao_Paulo")).toBe("2030-01-14");
  });
});

describe("sumWeek", () => {
  it("sums only days of the week", () => {
    const rows: DailyStats[] = [
      { date: "2030-01-06", counts: { view: 100 }, outside_hours: {} },
      {
        date: "2030-01-07",
        counts: { view: 10, booking_started: 2, request_started: 1, click_instagram: 4 },
        outside_hours: { booking_started: 2 },
      },
      { date: "2030-01-13", counts: { view: 5, booking_confirmed: 1 }, outside_hours: {} },
      { date: "2030-01-14", counts: { view: 50 }, outside_hours: {} },
    ];
    expect(sumWeek(rows, "2030-01-07")).toEqual({
      views: 15,
      conversations: 3,
      links: 4,
      requests: 0,
      bookings: 1,
      outsideHours: 2,
    });
  });
});
