import { describe, expect, it } from "vitest";

import { isIndexable, PROFILE_INDEX_RULES } from "./indexable";

const service = (price_cents: number) => ({
  id: crypto.randomUUID(),
  name: "Serviço",
  description: null,
  duration_minutes: 30,
  buffer_minutes: 0,
  price_cents,
  deposit_type: "none" as const,
  deposit_value: 0,
});

const complete = () => ({
  business: { portal_opt_out: false },
  page: {
    bio: "Barbearia no centro, corte e barba com hora marcada.",
    avatar_key: "avatars/a.webp",
    cover_key: null,
    primary_color_override: null,
    whatsapp_number: null,
    instagram_url: null,
    address: null,
    city: "Campinas",
    neighborhood: null,
    show_prices: true,
    has_pix: false,
  },
  services: [service(3000), service(4000), service(5000)],
});

describe("isIndexable", () => {
  it("indexes a complete profile", () => {
    expect(isIndexable(complete())).toBe(true);
  });

  it("respects the owner's opt-out of search", () => {
    expect(isIndexable({ ...complete(), business: { portal_opt_out: true } })).toBe(false);
  });

  it.each([
    ["no photo", (d: ReturnType<typeof complete>) => (d.page.avatar_key = null as never)],
    ["short bio", (d: ReturnType<typeof complete>) => (d.page.bio = "Curta")],
    ["no city", (d: ReturnType<typeof complete>) => (d.page.city = "" as never)],
    [
      "too few priced services",
      (d: ReturnType<typeof complete>) => (d.services = [service(3000), service(4000), service(0)]),
    ],
  ])("leaves out a profile with %s", (_label, change) => {
    const data = complete();
    change(data);
    expect(isIndexable(data)).toBe(false);
  });

  it("uses the documented minimums", () => {
    expect(PROFILE_INDEX_RULES).toEqual({ minBioLength: 30, minPricedServices: 3 });
  });

  it("never indexes a profile without page settings", () => {
    expect(isIndexable({ ...complete(), page: null })).toBe(false);
  });
});
