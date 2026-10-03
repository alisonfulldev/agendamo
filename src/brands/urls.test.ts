import { afterEach, describe, expect, it, vi } from "vitest";

import { beauty } from "@/brands/beauty";
import { brandUrl, hasRealDomain } from "@/brands/urls";

afterEach(() => vi.unstubAllEnvs());

describe("brandUrl", () => {
  it("production with a real domain uses the brand domain", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const brand = { ...beauty, domains: ["agendabeleza.com.br"] };
    expect(hasRealDomain(brand)).toBe(true);
    expect(brandUrl(brand, "/x")).toBe("https://agendabeleza.com.br/x");
  });

  it("a provisional *.example.com domain falls back to the app URL with ?brand=", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://agendamo.vercel.app");
    const brand = { ...beauty, domains: ["beauty.example.com"] };
    expect(hasRealDomain(brand)).toBe(false);
    expect(brandUrl(brand, "/x")).toBe("https://agendamo.vercel.app/x?brand=beauty");
  });
});
