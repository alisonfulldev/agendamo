import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { createTestDb, SEED } from "./harness";

let db: PGlite;
let customerId: string;

function book(start: string, code: string | null) {
  return db.query("select public.book_appointment($1)", [
    {
      business_id: SEED.physio.business,
      professional_id: SEED.physio.professionals[0],
      customer_id: customerId,
      starts_at: start,
      ends_at: new Date(new Date(start).getTime() + 30 * 60_000).toISOString(),
      status: "confirmed",
      source: "chat",
      coupon_code: code,
      discount_cents: code ? 450 : 0,
      services: [
        {
          service_id: SEED.physio.services[0],
          name: "Corte",
          duration_minutes: 30,
          price_cents: 4500,
        },
      ],
    },
  ]);
}

beforeAll(async () => {
  db = await createTestDb({ seed: true });
  const { rows } = await db.query<{ id: string }>(
    "insert into public.customers (business_id, name, phone) values ($1, 'C', '5511900001111') returning id",
    [SEED.physio.business],
  );
  customerId = rows[0]!.id;
  await db.query(
    `insert into public.business_coupons (business_id, code, discount_type, discount_value, max_uses, valid_until) values
       ($1, 'DEZ', 'percent', 10, 1, now() + interval '1 day'),
       ($1, 'VENCIDO', 'fixed', 1000, null, now() - interval '1 day')`,
    [SEED.physio.business],
  );
}, 60_000);

describe("business coupons", () => {
  it("previews the discount without using the coupon", async () => {
    const { rows } = await db.query<{ d: number | null }>(
      "select public.preview_business_coupon($1, ' dez ', 4500) as d",
      [SEED.physio.business],
    );
    expect(rows[0]!.d).toBe(450);
  });

  it("rejects expired coupons", async () => {
    const { rows } = await db.query<{ d: number | null }>(
      "select public.preview_business_coupon($1, 'VENCIDO', 4500) as d",
      [SEED.physio.business],
    );
    expect(rows[0]!.d).toBeNull();
    await expect(book("2030-03-05T12:00:00Z", "VENCIDO")).rejects.toThrow(/coupon_invalid/);
  });

  it("a failed booking does not consume the coupon; max uses is enforced", async () => {
    await book("2030-03-05T13:00:00Z", null);
    await expect(book("2030-03-05T13:00:00Z", "DEZ")).rejects.toThrow(/appointments_no_overlap/);
    const before = await db.query<{ uses: number }>(
      "select uses from public.business_coupons where code = 'DEZ'",
    );
    expect(before.rows[0]!.uses).toBe(0);

    await book("2030-03-05T14:00:00Z", "DEZ");
    await expect(book("2030-03-05T15:00:00Z", "DEZ")).rejects.toThrow(/coupon_invalid/);
  });
});
