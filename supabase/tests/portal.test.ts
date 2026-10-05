import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { createTestDb } from "./harness";

let db: PGlite;

async function business(
  slug: string,
  brand: string,
  opts: { complete?: boolean; city?: string; neighborhood?: string; optOut?: boolean } = {},
) {
  const { complete = true, city = "São Paulo", neighborhood = "Moema", optOut = false } = opts;
  const { rows } = await db.query<{ id: string }>(
    "insert into public.businesses (name, slug, brand_key, segment, portal_opt_out) values ($1, $1, $2, $2, $3) returning id",
    [slug, brand, optOut],
  );
  const id = rows[0]!.id;
  await db.query(
    "insert into public.page_settings (business_id, avatar_key, bio, city, neighborhood) values ($1, $2, $3, $4, $5)",
    [
      id,
      complete ? "businesses/x/avatar/a.webp" : null,
      "Atendimento com carinho e muita técnica há 10 anos.",
      city,
      neighborhood,
    ],
  );
  for (const [name, price] of [
    ["Corte", 4500],
    ["Escova", 6000],
    ["Manicure", 4000],
  ] as const) {
    await db.query(
      "insert into public.services (business_id, name, duration_minutes, price_cents) values ($1, $2, 30, $3)",
      [id, name, price],
    );
  }
  return id;
}

beforeAll(async () => {
  db = await createTestDb();
  await business("salao-um", "psychology");
  await business("salao-dois", "psychology");
  const featured = await business("salao-tres", "psychology");
  await business("salao-incompleto", "psychology", { complete: false });
  await business("salao-fora", "psychology", { optOut: true });
  await business("barbearia-sp", "physio");
  // Bare business: no photo, no bio, one free service. Listed, never indexed.
  const { rows: bare } = await db.query<{ id: string }>(
    "insert into public.businesses (name, slug, brand_key, segment) values ('Sem foto', 'sem-foto', 'psychology', 'psychology') returning id",
  );
  await db.query("insert into public.page_settings (business_id, city) values ($1, 'São Paulo')", [
    bare[0]!.id,
  ]);
  await db.query(
    "insert into public.services (business_id, name, duration_minutes, price_cents) values ($1, 'Corte', 30, 0)",
    [bare[0]!.id],
  );
  // No city: nowhere to list it.
  await business("sem-cidade", "psychology", { city: "" });
  await db.query(
    "insert into public.portal_featured (business_id, city, active_until) values ($1, 'São Paulo', now() + interval '10 days')",
    [featured],
  );
}, 60_000);

describe("portal SEO rules", () => {
  it("indexes only complete businesses of the brand", async () => {
    const { rows } = await db.query<{ slug: string }>(
      "select slug from public.indexable_businesses('psychology') order by slug",
    );
    expect(rows.map((r) => r.slug)).toEqual(["salao-dois", "salao-tres", "salao-um"]);
  });

  it("indexes listing pages only with 3+ complete businesses", async () => {
    const { rows } = await db.query<{ path: string }>(
      "select path from public.indexable_portal_pages('psychology') order by path",
    );
    expect(rows.map((r) => r.path)).toContain("/explorar/sao-paulo/corte");
    expect(rows.map((r) => r.path)).toContain("/explorar/sao-paulo/moema/corte");
    const barber = await db.query("select path from public.indexable_portal_pages('physio')");
    expect(barber.rows).toEqual([]);
  });

  it("lists featured first and never shows another brand", async () => {
    const { rows } = await db.query<{ slug: string; featured: boolean }>(
      "select slug, featured from public.portal_listing('psychology', 'sao-paulo', 'corte')",
    );
    expect(rows[0]).toEqual(expect.objectContaining({ slug: "salao-tres", featured: true }));
    expect(rows.map((r) => r.slug)).not.toContain("barbearia-sp");
    expect(rows.map((r) => r.slug)).not.toContain("salao-fora");
  });

  it("lists any business with a city and a service, complete profiles first", async () => {
    const { rows } = await db.query<{ slug: string; min_price_cents: number }>(
      "select slug, min_price_cents from public.portal_listing('psychology', 'sao-paulo', 'corte')",
    );
    const slugs = rows.map((r) => r.slug);
    expect(slugs).toEqual(expect.arrayContaining(["salao-incompleto", "sem-foto"]));
    expect(slugs).not.toContain("sem-cidade");
    // Complete profiles come before the incomplete ones (no reviews, no featured here).
    expect(slugs.indexOf("salao-um")).toBeLessThan(slugs.indexOf("salao-incompleto"));
    expect(slugs.indexOf("salao-um")).toBeLessThan(slugs.indexOf("sem-foto"));
    // A free service shows no "a partir de" price.
    expect(rows.find((r) => r.slug === "sem-foto")?.min_price_cents).toBe(0);
  });

  it("never indexes incomplete businesses", async () => {
    const { rows } = await db.query<{ slug: string }>(
      "select slug from public.indexable_businesses('psychology')",
    );
    expect(rows.map((r) => r.slug)).not.toContain("sem-foto");
    expect(rows.map((r) => r.slug)).not.toContain("salao-incompleto");
  });

  it("drops the featured flag when the add-on expires", async () => {
    await db.query("update public.portal_featured set active_until = now() - interval '1 day'");
    const { rows } = await db.query<{ featured: boolean }>(
      "select featured from public.portal_listing('psychology', 'sao-paulo', 'corte')",
    );
    expect(rows.every((r) => !r.featured)).toBe(true);
  });
});
