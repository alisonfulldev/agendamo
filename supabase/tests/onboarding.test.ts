import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { as, createTestDb, createUser } from "./harness";

const USER = "a0000000-0000-4000-8000-000000000010";

const payload = {
  name: "Barbearia Teste",
  slug: "barbearia-teste",
  brand_key: "physio",
  segment: "physio",
  page: { whatsapp_number: "5511999998888", city: "Campinas" },
  services: [
    { name: "Corte", duration_minutes: 30, price_cents: 4500 },
    { name: "Barba", duration_minutes: 30, price_cents: 3500 },
  ],
  hours: [
    { weekday: 2, start_time: "09:00", end_time: "12:00" },
    { weekday: 2, start_time: "13:00", end_time: "18:00" },
  ],
};

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb();
  await createUser(db, USER);
}, 60_000);

describe("create_business", () => {
  it("is not callable by API users", async () => {
    await expect(
      as(db, { role: "authenticated", userId: USER }, (tx) =>
        tx.query("select public.create_business($1, $2)", [USER, payload]),
      ),
    ).rejects.toThrow(/permission denied/);
  });

  it("creates everything atomically and the owner can read it", async () => {
    const { rows } = await db.query<{ id: string }>("select public.create_business($1, $2) as id", [
      USER,
      payload,
    ]);
    const businessId = rows[0]!.id;

    await as(db, { role: "authenticated", userId: USER }, async (tx) => {
      const business = await tx.query<{ brand_key: string; plan: string }>(
        "select brand_key, plan from public.businesses where id = $1",
        [businessId],
      );
      expect(business.rows[0]).toEqual({ brand_key: "physio", plan: "free" });
      const services = await tx.query("select id from public.services where business_id = $1", [
        businessId,
      ]);
      expect(services.rows).toHaveLength(2);
      const links = await tx.query(
        "select * from public.professional_services where business_id = $1",
        [businessId],
      );
      expect(links.rows).toHaveLength(2);
      const hours = await tx.query("select * from public.working_hours where business_id = $1", [
        businessId,
      ]);
      expect(hours.rows).toHaveLength(2);
      const page = await tx.query<{ city: string }>(
        "select city from public.page_settings where business_id = $1",
        [businessId],
      );
      expect(page.rows[0]!.city).toBe("Campinas");
      const member = await tx.query<{ role: string }>(
        "select role from public.members where user_id = $1",
        [USER],
      );
      expect(member.rows[0]!.role).toBe("owner");
    });
  });

  it("refuses a second business for the same user", async () => {
    await expect(
      db.query("select public.create_business($1, $2)", [
        USER,
        { ...payload, slug: "outra-barbearia" },
      ]),
    ).rejects.toThrow(/already has a business/);
  });

  it("rolls back everything when a part fails", async () => {
    const other = "a0000000-0000-4000-8000-000000000011";
    await createUser(db, other);
    await expect(
      db.query("select public.create_business($1, $2)", [
        other,
        {
          ...payload,
          slug: "rollback-teste",
          hours: [{ weekday: 9, start_time: "09:00", end_time: "10:00" }],
        },
      ]),
    ).rejects.toThrow();
    const { rows } = await db.query(
      "select id from public.businesses where slug = 'rollback-teste'",
    );
    expect(rows).toEqual([]);
  });
});
