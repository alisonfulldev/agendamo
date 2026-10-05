import { describe, expect, it } from "vitest";

import { returnIntervalText } from "@/lib/booking/next-visit";

describe("returnIntervalText", () => {
  it.each([
    [1, "1 dia"],
    [10, "10 dias"],
    [7, "1 semana"],
    [21, "3 semanas"],
    [28, "4 semanas"],
    [30, "1 mês"],
    [60, "2 meses"],
    [45, "45 dias"],
  ])("%i days -> %s", (days, text) => {
    expect(returnIntervalText(days)).toBe(text);
  });
});
