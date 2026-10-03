import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { as, createTestDb, createUser, SEED } from "./harness";

const OWNER_BEAUTY = "a0000000-0000-4000-8000-000000000001";
const OWNER_BARBER = "a0000000-0000-4000-8000-000000000002";
const STAFF_ANA = "a0000000-0000-4000-8000-000000000003";

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb({ seed: true });
  for (const id of [OWNER_BEAUTY, OWNER_BARBER, STAFF_ANA]) await createUser(db, id);
  await db.query(
    `insert into public.members (business_id, user_id, role, professional_id) values
       ($1, $2, 'owner', null), ($3, $4, 'owner', null), ($1, $5, 'staff', $6)`,
    [
      SEED.beauty.business,
      OWNER_BEAUTY,
      SEED.barber.business,
      OWNER_BARBER,
      STAFF_ANA,
      SEED.beauty.professionals[0],
    ],
  );
  // Server-side inserts (as the table owner, like the service role).
  for (const business of [SEED.beauty.business, SEED.barber.business]) {
    await db.query(
      `insert into public.booking_requests (business_id, customer_name, phone) values ($1, 'Maria', '5511988887777')`,
      [business],
    );
    await db.query(
      `insert into public.page_events (business_id, type, session_id) values ($1, 'view', gen_random_uuid())`,
      [business],
    );
  }
  await db.query(
    `insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values
       ($1, 'https://push.example/1', 'k', 'a'), ($2, 'https://push.example/2', 'k', 'a')`,
    [OWNER_BEAUTY, OWNER_BARBER],
  );
}, 60_000);

const VISITOR_INSERTS: [string, string, (business: string) => unknown[]][] = [
  [
    "booking_requests",
    "insert into public.booking_requests (business_id, customer_name, phone) values ($1, 'X', '5511900000000')",
    (b) => [b],
  ],
  [
    "page_events",
    "insert into public.page_events (business_id, type, session_id) values ($1, 'view', gen_random_uuid())",
    (b) => [b],
  ],
  [
    "abandoned_bookings",
    "insert into public.abandoned_bookings (business_id, consent) values ($1, true)",
    (b) => [b],
  ],
  [
    "waitlist_entries",
    `insert into public.waitlist_entries (business_id, service_id, date, customer_name, phone)
     values ($1, '${SEED.beauty.services[0]}', current_date, 'X', '5511900000000')`,
    (b) => [b],
  ],
];

describe("visitor data is written only by the server", () => {
  for (const [table, sql, params] of VISITOR_INSERTS) {
    it(`anon cannot insert into ${table}`, async () => {
      await expect(
        as(db, { role: "anon" }, (tx) => tx.query(sql, params(SEED.beauty.business))),
      ).rejects.toThrow(/row-level security/);
    });

    it(`the owner cannot insert into ${table} either`, async () => {
      await expect(
        as(db, { role: "authenticated", userId: OWNER_BEAUTY }, (tx) =>
          tx.query(sql, params(SEED.beauty.business)),
        ),
      ).rejects.toThrow(/row-level security/);
    });
  }

  it("rejects abandoned bookings without consent", async () => {
    await expect(
      db.query("insert into public.abandoned_bookings (business_id, consent) values ($1, false)", [
        SEED.beauty.business,
      ]),
    ).rejects.toThrow();
  });
});

describe("visitor data is read only by the business owner", () => {
  it("owner reads own requests and events only", async () => {
    await as(db, { role: "authenticated", userId: OWNER_BEAUTY }, async (tx) => {
      const requests = await tx.query<{ business_id: string }>(
        "select business_id from public.booking_requests",
      );
      expect(requests.rows.map((r) => r.business_id)).toEqual([SEED.beauty.business]);
      const events = await tx.query<{ business_id: string }>(
        "select business_id from public.page_events",
      );
      expect(events.rows.map((r) => r.business_id)).toEqual([SEED.beauty.business]);
    });
  });

  it("staff and anon read nothing", async () => {
    for (const actor of [
      { role: "authenticated", userId: STAFF_ANA } as const,
      { role: "anon" } as const,
    ]) {
      await as(db, actor, async (tx) => {
        expect((await tx.query("select id from public.booking_requests")).rows).toEqual([]);
        expect((await tx.query("select id from public.page_events")).rows).toEqual([]);
      });
    }
  });
});

describe("server-only tables", () => {
  it("are invisible to authenticated users", async () => {
    await db.query(
      `insert into public.notification_log (business_id, type, reference) values ($1, 't', 'r')`,
      [SEED.beauty.business],
    );
    await db.query(
      `insert into public.platform_coupons (code, discount_percent) values ('LANCE10', 10)`,
    );
    await as(db, { role: "authenticated", userId: OWNER_BEAUTY }, async (tx) => {
      expect((await tx.query("select * from public.notification_log")).rows).toEqual([]);
      expect((await tx.query("select * from public.platform_coupons")).rows).toEqual([]);
      expect((await tx.query("select * from public.calendar_connections")).rows).toEqual([]);
      expect((await tx.query("select * from public.review_tokens")).rows).toEqual([]);
    });
  });

  it("notification_log rejects duplicates per business, type and reference", async () => {
    await expect(
      db.query(
        `insert into public.notification_log (business_id, type, reference) values ($1, 't', 'r')`,
        [SEED.beauty.business],
      ),
    ).rejects.toThrow(/duplicate key/);
  });
});

describe("personal tables", () => {
  it("users see only their own push subscriptions", async () => {
    await as(db, { role: "authenticated", userId: OWNER_BEAUTY }, async (tx) => {
      const { rows } = await tx.query<{ endpoint: string }>(
        "select endpoint from public.push_subscriptions",
      );
      expect(rows.map((r) => r.endpoint)).toEqual(["https://push.example/1"]);
    });
  });
});

describe("plan limits", () => {
  it("photo_limit and professional_limit", async () => {
    const { rows } = await db.query<Record<string, number>>(
      `select public.photo_limit('free') as pf, public.photo_limit('pro') as pp, public.photo_limit('team') as pt,
              public.professional_limit('free') as rf, public.professional_limit('pro') as rp,
              public.professional_limit('team') as rt`,
    );
    // Single plan: 60 photos for everyone (trial included).
    expect(rows[0]).toEqual({ pf: 60, pp: 60, pt: 60, rf: 1, rp: 1, rt: 5 });
  });
});

describe("referrals", () => {
  it("a customer can only be referred once", async () => {
    await as(db, { role: "service_role" }, async (tx) => {
      const ids = await tx.query<{ id: string }>(
        `insert into public.customers (business_id, name) values ($1, 'A'), ($1, 'B'), ($1, 'C') returning id`,
        [SEED.beauty.business],
      );
      const [a, b, c] = ids.rows.map((r) => r.id);
      await tx.query(
        "insert into public.referrals (business_id, referrer_customer_id, referred_customer_id) values ($1, $2, $3)",
        [SEED.beauty.business, a, c],
      );
      await expect(
        tx.query(
          "insert into public.referrals (business_id, referrer_customer_id, referred_customer_id) values ($1, $2, $3)",
          [SEED.beauty.business, b, c],
        ),
      ).rejects.toThrow(/duplicate key/);
    });
  });
});
