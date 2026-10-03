import { describe, expect, it } from "vitest";

import { buildIcs } from "@/lib/ics";

describe("buildIcs", () => {
  const ics = buildIcs({
    uid: "abc@lively",
    start: new Date("2030-01-08T12:00:00Z"),
    end: new Date("2030-01-08T13:00:00Z"),
    title: "Corte, barba; e mais",
    location: "Rua A, 10",
  });

  it("uses UTC times, CRLF and escapes text", () => {
    expect(ics).toContain("DTSTART:20300108T120000Z\r\n");
    expect(ics).toContain("DTEND:20300108T130000Z\r\n");
    expect(ics).toContain("SUMMARY:Corte\\, barba\\; e mais");
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
  });

  it("folds long lines", () => {
    const long = buildIcs({ uid: "x", start: new Date(), end: new Date(), title: "a".repeat(200) });
    expect(long.split("\r\n").every((line) => line.length <= 75)).toBe(true);
  });

  it("marks cancellations", () => {
    const cancelled = buildIcs({
      uid: "x",
      start: new Date(),
      end: new Date(),
      title: "t",
      status: "CANCELLED",
    });
    expect(cancelled).toContain("METHOD:CANCEL");
    expect(cancelled).toContain("STATUS:CANCELLED");
  });
});
