import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { createTestDb } from "./harness";

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb();
}, 60_000);

describe("“Outro / Geral” niche", () => {
  it("accepts the general segment with the free text of what the business does", async () => {
    const { rows } = await db.query<{ brand_key: string; niche_description: string }>(
      `insert into public.businesses (name, slug, brand_key, segment, niche_description)
       values ('Ateliê Livre', 'atelie-livre', 'general', 'general', 'Restauro móveis antigos')
       returning brand_key, niche_description`,
    );
    expect(rows[0]).toEqual({ brand_key: "general", niche_description: "Restauro móveis antigos" });
  });

  it("limits the free text to 200 characters", async () => {
    await expect(
      db.query(
        `insert into public.businesses (name, slug, brand_key, segment, niche_description)
         values ('Longo', 'texto-longo', 'general', 'general', $1)`,
        ["x".repeat(201)],
      ),
    ).rejects.toThrow();
  });

  it("still refuses unknown segments", async () => {
    await expect(
      db.query(
        "insert into public.businesses (name, slug, brand_key, segment) values ('X', 'segmento-x', 'general', 'astrology')",
      ),
    ).rejects.toThrow();
  });
});
