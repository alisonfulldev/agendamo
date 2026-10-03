import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { createTestDb, SEED } from "./harness";

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb({ seed: true });
  // 2030-01-08 02:00Z is still 2030-01-07 in São Paulo (UTC-3).
  await db.query(
    `insert into public.page_events (business_id, type, session_id, occurred_at, outside_hours) values
       ($1, 'view', gen_random_uuid(), '2030-01-08T02:00:00Z', true),
       ($1, 'view', gen_random_uuid(), '2030-01-08T13:00:00Z', false),
       ($1, 'view', gen_random_uuid(), '2030-01-08T14:00:00Z', false),
       ($1, 'click_book', gen_random_uuid(), '2030-01-08T23:30:00Z', true)`,
    [SEED.beauty.business],
  );
}, 60_000);

describe("refresh_page_stats", () => {
  it("groups by local date and type, counting outside hours", async () => {
    await db.query("select public.refresh_page_stats('2030-01-07')");
    const { rows } = await db.query<{
      date: string;
      counts: Record<string, number>;
      outside_hours: Record<string, number>;
    }>(
      "select date::text, counts, outside_hours from public.page_stats_daily where business_id = $1 order by date",
      [SEED.beauty.business],
    );
    expect(rows).toEqual([
      { date: "2030-01-07", counts: { view: 1 }, outside_hours: { view: 1 } },
      { date: "2030-01-08", counts: { view: 2, click_book: 1 }, outside_hours: { click_book: 1 } },
    ]);
  });

  it("is idempotent", async () => {
    await db.query("select public.refresh_page_stats('2030-01-07')");
    await db.query("select public.refresh_page_stats('2030-01-07')");
    const { rows } = await db.query<{ counts: Record<string, number> }>(
      "select counts from public.page_stats_daily where business_id = $1 and date = '2030-01-08'",
      [SEED.beauty.business],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.counts).toEqual({ view: 2, click_book: 1 });
  });
});

describe("cron jobs", () => {
  it("schedules every route and skips calls until configured", async () => {
    const { rows } = await db.query<{ jobname: string }>(
      "select jobname from cron.job order by jobname",
    );
    expect(rows.map((r) => r.jobname)).toEqual([
      "cleanup",
      "daily-alert",
      "deposits",
      "empty-slots",
      "marketing",
      "portal-stats",
      "reminders",
      "stats",
      "trial",
      "weekly-summary",
    ]);
    await db.query("select private.call_cron('stats')");
    expect((await db.query("select * from net.requests")).rows).toHaveLength(0);
  });

  it("calls the route with the secret once configured", async () => {
    await db.query(
      "insert into private.cron_settings (key, value) values ('app_url', 'https://app.example.com/'), ('cron_secret', 's3cret')",
    );
    await db.query("select private.call_cron('stats')");
    const { rows } = await db.query<{ url: string; headers: Record<string, string> }>(
      "select url, headers from net.requests",
    );
    expect(rows[0]!.url).toBe("https://app.example.com/api/cron/stats");
    expect(rows[0]!.headers.Authorization).toBe("Bearer s3cret");
  });
});
