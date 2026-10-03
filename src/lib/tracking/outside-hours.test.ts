import { describe, expect, it } from "vitest";

import { isOutsideHours } from "@/lib/tracking/outside-hours";

// Tuesday 09–12 and 13–18 in São Paulo (UTC-3).
const ranges = [
  { weekday: 2, start_time: "09:00:00", end_time: "12:00:00" },
  { weekday: 2, start_time: "13:00:00", end_time: "18:00:00" },
];
const tz = "America/Sao_Paulo";

describe("isOutsideHours", () => {
  it.each([
    ["2030-01-08T13:30:00Z", false], // Tue 10:30 local
    ["2030-01-08T15:30:00Z", true], // Tue 12:30 local (lunch)
    ["2030-01-08T21:00:00Z", true], // Tue 18:00 local (closed, end exclusive)
    ["2030-01-08T11:59:00Z", true], // Tue 08:59 local
    ["2030-01-09T13:30:00Z", true], // Wednesday
    ["2030-01-09T02:30:00Z", true], // Tue 23:30 local, still Tuesday locally
  ])("%s -> outside=%s", (iso, expected) => {
    expect(isOutsideHours(new Date(iso), tz, ranges)).toBe(expected);
  });
});
