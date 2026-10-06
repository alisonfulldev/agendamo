import { afterEach, describe, expect, it, vi } from "vitest";

describe("temporary test price (NEXT_PUBLIC_PRICE_TEST_CENTS)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("charges the test price for everyone, monthly and yearly", async () => {
    vi.stubEnv("NEXT_PUBLIC_PRICE_TEST_CENTS", "500");
    const { PLAN_PRICES, subscriptionPrice } = await import("@/lib/plans");
    expect(PLAN_PRICES.monthly).toBe(500);
    expect(PLAN_PRICES.yearly).toBe(500);
    expect(subscriptionPrice("monthly", 0)).toBe(500);
  });

  it("never goes below the Asaas minimum of R$ 5", async () => {
    vi.stubEnv("NEXT_PUBLIC_PRICE_TEST_CENTS", "100");
    const { PLAN_PRICES } = await import("@/lib/plans");
    expect(PLAN_PRICES.monthly).toBe(500);
  });

  it("without it, the normal prices", async () => {
    vi.stubEnv("NEXT_PUBLIC_PRICE_TEST_CENTS", "");
    const { PLAN_PRICES } = await import("@/lib/plans");
    expect(PLAN_PRICES.monthly).toBe(1900);
    expect(PLAN_PRICES.yearly).toBe(19200);
  });
});
