import { describe, expect, it } from "vitest";

import { chargedPrices, depositFor } from "@/lib/booking/pricing";

const s = (
  priceCents: number,
  depositType: "none" | "fixed" | "percent" = "none",
  depositValue = 0,
) => ({
  priceCents,
  depositType,
  depositValue,
});

describe("chargedPrices", () => {
  it("keeps list prices without a combo", () => {
    expect(chargedPrices([s(4500), s(3500)], null)).toEqual([4500, 3500]);
  });

  it("splits the combo price proportionally and sums exactly", () => {
    const prices = chargedPrices([s(4500), s(3500)], 7000);
    expect(prices.reduce((a, b) => a + b, 0)).toBe(7000);
    expect(prices).toEqual([3937, 3063]);
  });

  it("splits evenly when services are free", () => {
    expect(chargedPrices([s(0), s(0), s(0)], 1000)).toEqual([333, 333, 334]);
  });
});

describe("depositFor", () => {
  it("adds fixed deposits and percent of the charged price", () => {
    const services = [s(10000, "fixed", 2000), s(5000, "percent", 50)];
    expect(depositFor(services, [10000, 5000], 15000)).toBe(4500);
  });

  it("never exceeds the total after discount", () => {
    expect(depositFor([s(3000, "fixed", 5000)], [3000], 2500)).toBe(2500);
  });

  it("is zero without deposit services", () => {
    expect(depositFor([s(3000)], [3000], 3000)).toBe(0);
  });
});
