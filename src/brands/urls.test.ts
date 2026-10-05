import { afterEach, describe, expect, it, vi } from "vitest";

import { psychology } from "@/brands/psychology";
import { brandUrl, hasRealDomain } from "@/brands/urls";

afterEach(() => vi.unstubAllEnvs());

describe("brandUrl", () => {
  it("production with a real domain uses the brand domain", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const brand = { ...psychology, domains: ["agendapsi.com.br"] };
    expect(hasRealDomain(brand)).toBe(true);
    expect(brandUrl(brand, "/x")).toBe("https://agendapsi.com.br/x");
  });

  it("a provisional *.example.com domain falls back to the app URL with ?brand=", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://agendamo.vercel.app");
    const brand = { ...psychology, domains: ["psicologia.example.com"] };
    expect(hasRealDomain(brand)).toBe(false);
    expect(brandUrl(brand, "/x")).toBe("https://agendamo.vercel.app/x?brand=psychology");
  });
});
