import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { createTestDb, SEED } from "./harness";

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb({ seed: true });
  await db.query(
    `insert into public.portal_events (brand_key, city, service_slug, business_id, type, session_id, occurred_at) values
       ('psychology', 'sao-paulo', 'manicure', null, 'view', gen_random_uuid(), '2030-05-10T22:00:00Z'),
       ('psychology', 'sao-paulo', 'manicure', null, 'search', gen_random_uuid(), '2030-05-10T22:30:00Z'),
       ('psychology', 'sao-paulo', 'manicure', $1, 'view', gen_random_uuid(), '2030-05-11T13:00:00Z'),
       ('psychology', 'sao-paulo', 'manicure', $1, 'click', gen_random_uuid(), '2030-05-11T13:01:00Z'),
       ('psychology', 'sao-paulo', 'manicure', $1, 'view', gen_random_uuid(), '2030-06-01T13:00:00Z')`,
    [SEED.psychology.business],
  );
}, 60_000);

describe("refresh_portal_stats", () => {
  it("aggregates a month and is idempotent", async () => {
    await db.query("select public.refresh_portal_stats('2030-05-20')");
    await db.query("select public.refresh_portal_stats('2030-05-20')");
    const business = await db.query<{ appearances: number; clicks: number }>(
      "select appearances, clicks from public.portal_business_stats_monthly where month = '2030-05-01'",
    );
    expect(business.rows).toEqual([{ appearances: 1, clicks: 1 }]);
    const hourly = await db.query<{ hour: number; searches: number }>(
      "select hour, searches from public.portal_hourly_monthly where month = '2030-05-01' order by hour",
    );
    expect(hourly.rows).toEqual([
      { hour: 10, searches: 1 },
      { hour: 19, searches: 2 },
    ]); // 22:00Z = 19:00 in São Paulo
    const totals = await db.query<{ searches: number }>(
      "select sum(searches)::int as searches from public.portal_stats_monthly where month = '2030-05-01'",
    );
    expect(totals.rows[0]!.searches).toBe(1);
  });
});
