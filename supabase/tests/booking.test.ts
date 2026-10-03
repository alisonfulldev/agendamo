import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { createTestDb, SEED } from "./harness";

let db: PGlite;
const [ANA, BRUNA] = SEED.beauty.professionals;

async function customer(phone: string, name = "Cliente") {
  const { rows } = await db.query<{ id: string; created: boolean; blocked: boolean }>(
    "select * from public.upsert_customer($1, $2, $3, null, false, null)",
    [SEED.beauty.business, name, phone],
  );
  return rows[0]!;
}

function book(
  customerId: string,
  professional: string,
  start: string,
  end: string,
  resources: unknown[] = [],
) {
  return db.query<{ id: string }>("select public.book_appointment($1) as id", [
    {
      business_id: SEED.beauty.business,
      professional_id: professional,
      customer_id: customerId,
      starts_at: start,
      ends_at: end,
      status: "confirmed",
      source: "chat",
      services: [
        {
          service_id: SEED.beauty.services[0],
          name: "Manicure",
          duration_minutes: 45,
          price_cents: 4000,
        },
      ],
      resources,
    },
  ]);
}

beforeAll(async () => {
  db = await createTestDb({ seed: true });
}, 60_000);

describe("upsert_customer", () => {
  it("creates once and reuses by phone", async () => {
    const first = await customer("5511911110000", "Maria");
    const again = await customer("5511911110000", "Maria Silva");
    expect(first.created).toBe(true);
    expect(again.created).toBe(false);
    expect(again.id).toBe(first.id);
  });

  it("never turns marketing opt-in off", async () => {
    await db.query(
      "select * from public.upsert_customer($1, 'Opt', '5511922220000', null, true, null)",
      [SEED.beauty.business],
    );
    await db.query(
      "select * from public.upsert_customer($1, 'Opt', '5511922220000', null, false, null)",
      [SEED.beauty.business],
    );
    const { rows } = await db.query<{ marketing_opt_in: boolean }>(
      "select marketing_opt_in from public.customers where phone = '5511922220000'",
    );
    expect(rows[0]!.marketing_opt_in).toBe(true);
  });
});

describe("book_appointment", () => {
  it("stores services and resources together", async () => {
    const c = await customer("5511933330000");
    const { rows } = await book(c.id, ANA, "2030-02-05T12:00:00Z", "2030-02-05T13:00:00Z", [
      {
        resource_id: SEED.beauty.resource,
        starts_at: "2030-02-05T12:00:00Z",
        ends_at: "2030-02-05T13:00:00Z",
      },
    ]);
    const id = rows[0]!.id;
    const services = await db.query(
      "select * from public.appointment_services where appointment_id = $1",
      [id],
    );
    const resources = await db.query(
      "select * from public.appointment_resources where appointment_id = $1",
      [id],
    );
    expect(services.rows).toHaveLength(1);
    expect(resources.rows).toHaveLength(1);
  });

  it("two bookings for the same slot produce a single appointment", async () => {
    const a = await customer("5511944440000");
    const b = await customer("5511955550000");
    const results = await Promise.allSettled([
      book(a.id, BRUNA, "2030-02-06T12:00:00Z", "2030-02-06T13:00:00Z"),
      book(b.id, BRUNA, "2030-02-06T12:30:00Z", "2030-02-06T13:30:00Z"),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const { rows } = await db.query(
      "select id from public.appointments where professional_id = $1 and starts_at::date = '2030-02-06'",
      [BRUNA],
    );
    expect(rows).toHaveLength(1);
  });

  it("a resource conflict writes nothing at all", async () => {
    const c = await customer("5511966660000");
    await expect(
      book(c.id, BRUNA, "2030-02-05T12:30:00Z", "2030-02-05T13:00:00Z", [
        {
          resource_id: SEED.beauty.resource,
          starts_at: "2030-02-05T12:30:00Z",
          ends_at: "2030-02-05T13:00:00Z",
        },
      ]),
    ).rejects.toThrow(/appointment_resources_no_overlap/);
    const { rows } = await db.query("select id from public.appointments where customer_id = $1", [
      c.id,
    ]);
    expect(rows).toEqual([]);
  });
});

describe("reschedule_appointment", () => {
  it("moves time and resources atomically", async () => {
    const c = await customer("5511977770000");
    const { rows } = await book(c.id, ANA, "2030-02-07T12:00:00Z", "2030-02-07T13:00:00Z", [
      {
        resource_id: SEED.beauty.resource,
        starts_at: "2030-02-07T12:00:00Z",
        ends_at: "2030-02-07T13:00:00Z",
      },
    ]);
    await db.query("select public.reschedule_appointment($1, $2, $3, $4, $5)", [
      rows[0]!.id,
      BRUNA,
      "2030-02-07T15:00:00Z",
      "2030-02-07T16:00:00Z",
      [
        {
          resource_id: SEED.beauty.resource,
          starts_at: "2030-02-07T15:00:00Z",
          ends_at: "2030-02-07T16:00:00Z",
        },
      ],
    ]);
    const moved = await db.query<{ professional_id: string; starts_at: Date }>(
      "select professional_id, starts_at from public.appointments where id = $1",
      [rows[0]!.id],
    );
    expect(moved.rows[0]!.professional_id).toBe(BRUNA);
    const res = await db.query<{ starts_at: Date }>(
      "select starts_at from public.appointment_resources where appointment_id = $1",
      [rows[0]!.id],
    );
    expect(res.rows).toHaveLength(1);
    expect(new Date(res.rows[0]!.starts_at).toISOString()).toBe("2030-02-07T15:00:00.000Z");
  });
});

describe("apply_plan_limits", () => {
  it("keeps up to 60 photos visible and only the first professionals within the seats", async () => {
    for (let i = 0; i < 62; i++) {
      await db.query(
        "insert into public.page_photos (business_id, object_key, width, height, size_bytes, position) values ($1, $2, 800, 800, 1000, $3)",
        [SEED.beauty.business, `businesses/x/photo/${i}.webp`, i],
      );
    }
    await db.query("select public.apply_plan_limits($1, 'pro')", [SEED.beauty.business]);
    const visible = await db.query<{ n: number }>(
      "select count(*)::int as n from public.page_photos where business_id = $1 and not hidden",
      [SEED.beauty.business],
    );
    expect(visible.rows[0]!.n).toBe(60);

    await db.query("select public.apply_professional_seats($1, 1)", [SEED.beauty.business]);
    await db.query("select public.apply_professional_seats($1, 1)", [SEED.beauty.business]); // idempotent
    const pros = await db.query<{ active: boolean }>(
      "select active from public.professionals where business_id = $1 order by position",
      [SEED.beauty.business],
    );
    expect(pros.rows.map((p) => p.active)).toEqual([true, false]);
    const seats = await db.query<{ professional_seats: number }>(
      "select professional_seats from public.businesses where id = $1",
      [SEED.beauty.business],
    );
    expect(seats.rows[0]!.professional_seats).toBe(1);
  });
});
