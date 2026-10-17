import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { getBrand } from "@/brands";
import { cityListing, type DirectoryBusiness } from "@/lib/directory/build";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/storage/r2", () => ({
  isStorageConfigured: () => false,
  publicUrl: (key: string | null) => (key ? `https://img.example/${key}` : null),
}));

const { cityMetadata, NicheCityPage } = await import("./niche-city-page");

const business = (slug: string, name: string, showPrices = true): DirectoryBusiness => ({
  slug,
  name,
  avatarKey: null,
  bio: "Corte e barba com hora marcada no centro.",
  city: "Campinas",
  citySlug: "campinas",
  neighborhood: "Centro",
  services: [
    { name: "Corte", priceCents: 4000 },
    { name: "Corte + barba", priceCents: 6500 },
  ],
  showPrices,
  updatedAt: "2026-10-12T10:00:00Z",
});

describe("NicheCityPage", () => {
  const brand = getBrand("barber")!;

  it("renders one H1, the real businesses, prices only when shown and the item list", () => {
    const listing = cityListing(
      [business("ze", "Barbearia do Zé"), business("ana", "Ana Barber", false)],
      "campinas",
    )!;
    const html = renderToStaticMarkup(<NicheCityPage brand={brand} listing={listing} />);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("Barbearias e barbeiros em Campinas");
    expect(html).toContain('href="/ze/perfil"');
    expect(html.match(/De R\$/g)).toHaveLength(1);
    expect(html).toContain('"@type":"ItemList"');
  });

  it("is noindex below the minimum and indexable from it", () => {
    const two = cityListing([business("a", "A"), business("b", "B")], "campinas")!;
    const three = cityListing(
      [business("a", "A"), business("b", "B"), business("c", "C")],
      "campinas",
    )!;
    expect(cityMetadata(brand, two).robots).toEqual({ index: false, follow: true });
    expect(cityMetadata(brand, three).robots).toBeUndefined();
    expect(String(cityMetadata(brand, three).alternates?.canonical)).toMatch(
      /\/barbearia\/campinas$/,
    );
  });
});
