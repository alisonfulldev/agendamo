import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_BRAND } from "@/brands";
import { needsFullReloadForBrand } from "@/brands/host";
import { getBrandByHost, isBrandSelectableHost, normalizeHost } from "@/brands/resolve";

describe("needsFullReloadForBrand", () => {
  it("reloads when ?brand= changes the brand on localhost / previews", () => {
    expect(
      needsFullReloadForBrand(new URL("http://localhost:3000/?brand=psychology"), "physio"),
    ).toBe(true);
    expect(
      needsFullReloadForBrand(new URL("https://x.vercel.app/?brand=physio"), "psychology"),
    ).toBe(true);
  });

  it("keeps client navigation when the brand does not change", () => {
    expect(
      needsFullReloadForBrand(new URL("http://localhost:3000/?brand=psychology"), "psychology"),
    ).toBe(false);
    expect(needsFullReloadForBrand(new URL("http://localhost:3000/painel"), "psychology")).toBe(
      false,
    );
  });

  it("never reloads on production domains (?brand= is ignored there)", () => {
    expect(
      needsFullReloadForBrand(
        new URL("https://psicologia.example.com/?brand=physio"),
        "psychology",
      ),
    ).toBe(false);
  });
});

describe("normalizeHost", () => {
  it.each([
    ["Psicologia.Example.com", "psicologia.example.com"],
    ["psicologia.example.com:443", "psicologia.example.com"],
    ["www.psicologia.example.com", "psicologia.example.com"],
    ["psicologia.example.com.", "psicologia.example.com"],
    ["localhost:3000", "localhost"],
    ["[::1]:3000", "[::1]"],
    ["", ""],
    [null, ""],
  ])("%s -> %s", (input, expected) => {
    expect(normalizeHost(input)).toBe(expected);
  });
});

describe("isBrandSelectableHost", () => {
  it.each(["localhost", "app.localhost", "127.0.0.1", "[::1]", "lively-git-feature.vercel.app"])(
    "allows %s",
    (host) => expect(isBrandSelectableHost(host)).toBe(true),
  );

  it.each(["psicologia.example.com", "example.com", "vercel.app.evil.com"])("rejects %s", (host) =>
    expect(isBrandSelectableHost(host)).toBe(false),
  );
});

describe("getBrandByHost", () => {
  describe("production domains", () => {
    it("maps each domain to its brand", () => {
      expect(getBrandByHost("psicologia.example.com").key).toBe("psychology");
      expect(getBrandByHost("fisioterapia.example.com").key).toBe("physio");
    });

    it("ignores case, port and www", () => {
      expect(getBrandByHost("WWW.Fisioterapia.Example.com:443").key).toBe("physio");
    });

    it("ignores ?brand= and the cookie", () => {
      expect(
        getBrandByHost("psicologia.example.com", { brandParam: "physio", brandCookie: "physio" })
          .key,
      ).toBe("psychology");
    });
  });

  describe("localhost and Vercel previews", () => {
    it.each(["localhost:3000", "127.0.0.1:3000", "lively-abc123.vercel.app"])(
      "picks the brand from ?brand= on %s",
      (host) => {
        expect(getBrandByHost(host, { brandParam: "physio" }).key).toBe("physio");
      },
    );

    it("uses the cookie when there is no param", () => {
      expect(getBrandByHost("localhost:3000", { brandCookie: "physio" }).key).toBe("physio");
    });

    it("prefers the param over the cookie", () => {
      expect(
        getBrandByHost("localhost:3000", { brandParam: "psychology", brandCookie: "physio" }).key,
      ).toBe("psychology");
    });

    it("ignores an unknown param and falls back to the cookie", () => {
      expect(
        getBrandByHost("localhost:3000", { brandParam: "nope", brandCookie: "physio" }).key,
      ).toBe("physio");
    });

    it("falls back to DEFAULT_BRAND without param or valid cookie", () => {
      expect(getBrandByHost("localhost:3000")).toBe(DEFAULT_BRAND);
      expect(getBrandByHost("localhost:3000", { brandCookie: "nope" })).toBe(DEFAULT_BRAND);
    });
  });

  describe("unknown hosts", () => {
    it("use DEFAULT_BRAND and ignore ?brand=", () => {
      expect(getBrandByHost("unknown.com", { brandParam: "physio" })).toBe(DEFAULT_BRAND);
      expect(getBrandByHost(null)).toBe(DEFAULT_BRAND);
    });
  });
});

describe("main site domain (NEXT_PUBLIC_APP_URL)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("picks the brand with ?brand= / cookie on the main domain, with or without www", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://meetchat.com.br");
    expect(getBrandByHost("meetchat.com.br", { brandParam: "physio" }).key).toBe("physio");
    expect(getBrandByHost("www.meetchat.com.br", { brandCookie: "physio" }).key).toBe("physio");
  });

  it("other unknown domains still ignore ?brand=", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://meetchat.com.br");
    expect(getBrandByHost("outrosite.com.br", { brandParam: "physio" })).toBe(DEFAULT_BRAND);
  });
});
