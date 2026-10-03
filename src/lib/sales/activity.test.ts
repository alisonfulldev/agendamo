import { describe, expect, it } from "vitest";

import {
  hasBirthdayInMonth,
  hasBirthdayOn,
  isDueToReturn,
  isInactive,
  type CustomerActivity,
} from "@/lib/sales/activity";

const base: CustomerActivity = {
  customer_id: "c",
  name: "Ana",
  phone: "5511999998888",
  email: "ana@x.com",
  birthdate: "1990-10-15",
  marketing_opt_in: true,
  blocked: false,
  last_appointment_id: "a",
  last_completed_at: "2030-01-01T12:00:00Z",
  last_service_id: "s",
  last_service_name: "Manicure",
  return_after_days: 15,
  has_future: false,
};

describe("customer activity rules", () => {
  it("inactive after N days without visit and nothing booked", () => {
    expect(isInactive(base, "2030-03-02", 60)).toBe(true);
    expect(isInactive(base, "2030-02-01", 60)).toBe(false);
    expect(isInactive({ ...base, has_future: true }, "2030-03-02", 60)).toBe(false);
    expect(isInactive({ ...base, blocked: true }, "2030-03-02", 60)).toBe(false);
  });

  it("due to return when the interval passed, up to 30 days late", () => {
    expect(isDueToReturn(base, "2030-01-15")).toBe(false);
    expect(isDueToReturn(base, "2030-01-16")).toBe(true);
    expect(isDueToReturn(base, "2030-02-15")).toBe(true);
    expect(isDueToReturn(base, "2030-02-16")).toBe(false);
    expect(isDueToReturn({ ...base, return_after_days: null }, "2030-01-20")).toBe(false);
  });

  it("birthdays", () => {
    expect(hasBirthdayInMonth(base, "10")).toBe(true);
    expect(hasBirthdayOn(base, "10-15")).toBe(true);
    expect(hasBirthdayOn(base, "10-16")).toBe(false);
  });
});
