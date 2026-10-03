import { describe, expect, it } from "vitest";

import { DEFAULT_BRAND } from "@/brands";
import { needsFullReloadForBrand } from "@/brands/host";
import { getBrandByHost, isBrandSelectableHost, normalizeHost } from "@/brands/resolve";

describe("needsFullReloadForBrand", () => {
  it("reloads when ?brand= changes the brand on localhost / previews", () => {
    expect(needsFullReloadForBrand(new URL("http://localhost:3000/?brand=beauty"), "barber")).toBe(
      true,
    );
    expect(needsFullReloadForBrand(new URL("https://x.vercel.app/?brand=barber"), "beauty")).toBe(
      true,
    );
  });

  it("keeps client navigation when the brand does not change", () => {
    expect(needsFullReloadForBrand(new URL("http://localhost:3000/?brand=beauty"), "beauty")).toBe(
      false,
    );
    expect(needsFullReloadForBrand(new URL("http://localhost:3000/painel"), "beauty")).toBe(false);
  });

  it("never reloads on production domains (?brand= is ignored there)", () => {
    expect(
      needsFullReloadForBrand(new URL("https://beauty.example.com/?brand=barber"), "beauty"),
    ).toBe(false);
  });
});

describe("normalizeHost", () => {
  it.each([
    ["Beauty.Example.com", "beauty.example.com"],
    ["beauty.example.com:443", "beauty.example.com"],
    ["www.beauty.example.com", "beauty.example.com"],
    ["beauty.example.com.", "beauty.example.com"],
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

  it.each(["beauty.example.com", "example.com", "vercel.app.evil.com"])("rejects %s", (host) =>
    expect(isBrandSelectableHost(host)).toBe(false),
  );
});

describe("getBrandByHost", () => {
  describe("production domains", () => {
    it("maps each domain to its brand", () => {
      expect(getBrandByHost("beauty.example.com").key).toBe("beauty");
      expect(getBrandByHost("barber.example.com").key).toBe("barber");
    });

    it("ignores case, port and www", () => {
      expect(getBrandByHost("WWW.Barber.Example.com:443").key).toBe("barber");
    });

    it("ignores ?brand= and the cookie", () => {
      expect(
        getBrandByHost("beauty.example.com", { brandParam: "barber", brandCookie: "barber" }).key,
      ).toBe("beauty");
    });
  });

  describe("localhost and Vercel previews", () => {
    it.each(["localhost:3000", "127.0.0.1:3000", "lively-abc123.vercel.app"])(
      "picks the brand from ?brand= on %s",
      (host) => {
        expect(getBrandByHost(host, { brandParam: "barber" }).key).toBe("barber");
      },
    );

    it("uses the cookie when there is no param", () => {
      expect(getBrandByHost("localhost:3000", { brandCookie: "barber" }).key).toBe("barber");
    });

    it("prefers the param over the cookie", () => {
      expect(
        getBrandByHost("localhost:3000", { brandParam: "beauty", brandCookie: "barber" }).key,
      ).toBe("beauty");
    });

    it("ignores an unknown param and falls back to the cookie", () => {
      expect(
        getBrandByHost("localhost:3000", { brandParam: "nope", brandCookie: "barber" }).key,
      ).toBe("barber");
    });

    it("falls back to DEFAULT_BRAND without param or valid cookie", () => {
      expect(getBrandByHost("localhost:3000")).toBe(DEFAULT_BRAND);
      expect(getBrandByHost("localhost:3000", { brandCookie: "nope" })).toBe(DEFAULT_BRAND);
    });
  });

  describe("unknown hosts", () => {
    it("use DEFAULT_BRAND and ignore ?brand=", () => {
      expect(getBrandByHost("unknown.com", { brandParam: "barber" })).toBe(DEFAULT_BRAND);
      expect(getBrandByHost(null)).toBe(DEFAULT_BRAND);
    });
  });
});
