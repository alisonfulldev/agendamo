import { afterEach, describe, expect, it, vi } from "vitest";

import { psychology } from "@/brands/psychology";
import { GENERAL_NICHE } from "@/brands";
import { brandUrl, businessUrl, canonicalUrl, hasRealDomain, nicheHubUrl } from "@/brands/urls";

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

describe("canonicalUrl", () => {
  it("uses the shared site without ?brand= while the brand has no real domain", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://meetchat.com.br");
    expect(canonicalUrl(psychology, "/ana/perfil?x=1#y")).toBe(
      "https://meetchat.com.br/ana/perfil",
    );
  });

  it("uses the brand's own domain in production", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const brand = { ...psychology, domains: ["agendapsi.com.br"] };
    expect(canonicalUrl(brand, "/ana/perfil")).toBe("https://agendapsi.com.br/ana/perfil");
  });
});

describe("nicheHubUrl", () => {
  it("links to the niche page on the shared site", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://meetchat.com.br");
    expect(nicheHubUrl(psychology)).toBe("https://meetchat.com.br/psicologia");
    expect(nicheHubUrl(GENERAL_NICHE)).toBe("https://meetchat.com.br/");
  });
});

describe("businessUrl", () => {
  it("is the short link, without ?brand=, on the shared site", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://meetchat.com.br");
    expect(businessUrl(psychology, "/fulano-de-tal")).toBe("https://meetchat.com.br/fulano-de-tal");
  });

  it("keeps the link's own parameters", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://meetchat.com.br");
    expect(businessUrl(psychology, "/ana?ref=AB12")).toBe("https://meetchat.com.br/ana?ref=AB12");
  });

  it("uses the brand's own domain when it has one", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const brand = { ...psychology, domains: ["agendapsi.com.br"] };
    expect(businessUrl(brand, "/ana")).toBe("https://agendapsi.com.br/ana");
  });
});
