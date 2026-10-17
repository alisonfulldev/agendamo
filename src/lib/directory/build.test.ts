import { describe, expect, it } from "vitest";

import {
  cityListing,
  DIRECTORY_CONFIG,
  directoryCities,
  priceRange,
  type DirectoryBusiness,
} from "./build";

const business = (over: Partial<DirectoryBusiness>): DirectoryBusiness => ({
  slug: "x",
  name: "Negócio",
  avatarKey: null,
  bio: null,
  city: "Campinas",
  citySlug: "campinas",
  neighborhood: null,
  services: [{ name: "Corte", priceCents: 4000 }],
  showPrices: true,
  updatedAt: "2026-10-10T10:00:00Z",
  ...over,
});

describe("directoryCities", () => {
  const list = [
    business({ slug: "a" }),
    business({ slug: "b", updatedAt: "2026-10-12T10:00:00Z" }),
    business({ slug: "c" }),
    business({ slug: "d", city: "São Paulo", citySlug: "sao-paulo" }),
    business({ slug: "e", city: "", citySlug: "" }),
  ];

  it("groups by city, most profiles first, with the newest change", () => {
    expect(directoryCities(list)).toEqual([
      {
        citySlug: "campinas",
        city: "Campinas",
        count: 3,
        updatedAt: "2026-10-12T10:00:00Z",
        indexable: true,
      },
      {
        citySlug: "sao-paulo",
        city: "São Paulo",
        count: 1,
        updatedAt: "2026-10-10T10:00:00Z",
        indexable: false,
      },
    ]);
  });

  it("is indexable only from the configured minimum", () => {
    const two = list.slice(0, DIRECTORY_CONFIG.minIndexable - 1);
    expect(directoryCities(two)[0]!.indexable).toBe(false);
  });
});

describe("cityListing", () => {
  it("lists the city's profiles alphabetically (no paid ranking)", () => {
    const listing = cityListing(
      [business({ slug: "z", name: "Zeca" }), business({ slug: "a", name: "Ana" })],
      "campinas",
    );
    expect(listing!.businesses.map((b) => b.name)).toEqual(["Ana", "Zeca"]);
  });

  it("is null for a city without profiles (404)", () => {
    expect(cityListing([business({})], "recife")).toBeNull();
  });
});

describe("priceRange", () => {
  it("uses priced services only", () => {
    expect(
      priceRange(
        business({
          services: [
            { name: "Avaliação", priceCents: 0 },
            { name: "Corte", priceCents: 4000 },
            { name: "Corte + barba", priceCents: 6500 },
          ],
        }),
      ),
    ).toEqual({ min: 4000, max: 6500 });
  });

  it("never shows prices the owner hides", () => {
    expect(priceRange(business({ showPrices: false }))).toBeNull();
  });
});
