import { describe, expect, it } from "vitest";

import { outreachMessage, outreachSituation } from "./admin-outreach";

const now = new Date("2026-11-06T12:00:00Z");
const base = {
  status: "trial" as const,
  createdAt: "2026-11-01T12:00:00Z",
  trialEndsAt: "2026-11-15T12:00:00Z",
  hasBooking: true,
  hasPhoto: true,
};

describe("outreachSituation", () => {
  it("picks the most useful message", () => {
    expect(outreachSituation({ ...base, createdAt: "2026-11-06T08:00:00Z" }, now)).toBe("welcome");
    expect(outreachSituation({ ...base, hasBooking: false }, now)).toBe("no_booking");
    expect(outreachSituation({ ...base, hasPhoto: false }, now)).toBe("no_photo");
    expect(outreachSituation({ ...base, trialEndsAt: "2026-11-08T12:00:00Z" }, now)).toBe(
      "trial_ending",
    );
    expect(outreachSituation({ ...base, status: "waiting" }, now)).toBe("waiting");
    expect(outreachSituation({ ...base, status: "subscribed" }, now)).toBe("subscribed");
    expect(outreachSituation({ ...base, status: "suspended" }, now)).toBeNull();
  });
});

describe("outreachMessage", () => {
  const input = { businessName: "Studio Ana", link: "https://meetchat.com.br/studio-ana" };
  it("speaks in first person and names the business", () => {
    const text = outreachMessage("no_booking", { ...input, trialEndsAt: null }, now);
    expect(text).toContain("desenvolvedor do MeetChat");
    expect(text).toContain("Studio Ana");
    expect(text).toContain(input.link);
  });
  it("counts the days left of the trial", () => {
    expect(
      outreachMessage("trial_ending", { ...input, trialEndsAt: "2026-11-09T12:00:00Z" }, now),
    ).toContain("termina em 3 dias");
    expect(
      outreachMessage("trial_ending", { ...input, trialEndsAt: "2026-11-07T10:00:00Z" }, now),
    ).toContain("termina amanhã");
  });
});
