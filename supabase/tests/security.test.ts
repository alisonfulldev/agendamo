import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { createTestDb } from "./harness";

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb();
});

describe("API exposure", () => {
  it("every public table has RLS enabled (tables are granted to the API roles)", async () => {
    const { rows } = await db.query<{ tablename: string }>(
      "select tablename from pg_tables where schemaname = 'public' and not rowsecurity",
    );
    expect(rows).toEqual([]);
  });

  it("onboarding stays service-role only", async () => {
    const { rows } = await db.query<{ anon: boolean; authenticated: boolean }>(
      `select has_function_privilege('anon', 'public.create_business(uuid, jsonb)', 'execute') as anon,
              has_function_privilege('authenticated', 'public.create_business(uuid, jsonb)', 'execute') as authenticated`,
    );
    expect(rows[0]).toEqual({ anon: false, authenticated: false });
  });
});
