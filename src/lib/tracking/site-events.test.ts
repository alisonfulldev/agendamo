import { describe, expect, it } from "vitest";

import { siteEventSchema } from "./site-events";

const valid = {
  type: "page_view",
  path: "/barbearia/campinas",
  template: "diretorio",
  niche: "barber",
  landing: "/barbearia",
  sessionId: "8a0e6c7d-2f8b-4c71-9a6c-1f2e3d4c5b6a",
};

describe("siteEventSchema", () => {
  it("accepts an anonymous page view", () => {
    expect(siteEventSchema.safeParse(valid).success).toBe(true);
  });

  it("refuses anything that could carry personal data", () => {
    for (const change of [
      { path: "/x?email=ana@example.com" },
      { path: "https://evil.example/" },
      { template: "perfil" },
      { niche: "Barber Shop" },
      { sessionId: "ana@example.com" },
      { type: "signup" },
    ]) {
      expect(
        siteEventSchema.safeParse({ ...valid, ...change }).success,
        JSON.stringify(change),
      ).toBe(false);
    }
  });

  it("drops unknown fields", () => {
    const parsed = siteEventSchema.parse({ ...valid, email: "ana@example.com" });
    expect(parsed).not.toHaveProperty("email");
  });
});
