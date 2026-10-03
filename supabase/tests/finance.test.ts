import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { as, createTestDb, createUser, SEED } from "./harness";

let db: PGlite;
const owner = "a0000000-0000-4000-8000-0000000000f1";
const other = "a0000000-0000-4000-8000-0000000000f2";

beforeAll(async () => {
  db = await createTestDb({ seed: true });
  await createUser(db, owner);
  await createUser(db, other);
  await db.query(
    "insert into public.members (business_id, user_id, role) values ($1, $2, 'owner')",
    [SEED.beauty.business, owner],
  );
  await db.query(
    "insert into public.members (business_id, user_id, role) values ($1, $2, 'owner')",
    [SEED.barber.business, other],
  );
});

async function appointment(status: string, discount = 0) {
  const customer = await db.query<{ id: string }>(
    "insert into public.customers (business_id, name) values ($1, 'Ana Souza') returning id",
    [SEED.beauty.business],
  );
  const created = await db.query<{ id: string }>(
    `insert into public.appointments (business_id, professional_id, customer_id, starts_at, ends_at, status, source, discount_cents)
     values ($1, $2, $3, now() - interval '3 days' - random() * interval '100 days', now() - interval '2 days', $4, 'manual', $5)
     returning id`,
    [SEED.beauty.business, SEED.beauty.professionals[0], customer.rows[0]!.id, status, discount],
  );
  const id = created.rows[0]!.id;
  await db.query(
    `insert into public.appointment_services (business_id, appointment_id, name, duration_minutes, price_cents, position)
     values ($1, $2, 'Manicure', 45, 4000, 0), ($1, $2, 'Esmalte', 10, 1000, 1)`,
    [SEED.beauty.business, id],
  );
  return id;
}

describe("single plan", () => {
  it("starts the 30-day trial when the business is created", async () => {
    const { rows } = await db.query<{ days: number }>(
      `insert into public.businesses (name, slug, brand_key, segment) values ('Novo', 'novo-teste', 'beauty', 'beauty')
       returning extract(day from trial_ends_at - trial_started_at)::int as days`,
    );
    expect(rows[0]!.days).toBe(30);
  });
});

describe("finance", () => {
  it("a completed appointment becomes a revenue (minus coupon) and leaving completed removes it", async () => {
    const id = await appointment("confirmed", 500);
    await db.query("update public.appointments set status = 'completed' where id = $1", [id]);
    await db.query("update public.appointments set status = 'completed' where id = $1", [id]);
    let entries = await db.query<{ amount_cents: number; description: string; kind: string }>(
      "select amount_cents, description, kind from public.finance_entries where appointment_id = $1",
      [id],
    );
    expect(entries.rows).toEqual([
      { amount_cents: 4500, description: "Manicure + Esmalte", kind: "income" },
    ]);

    await db.query("update public.appointments set status = 'no_show' where id = $1", [id]);
    entries = await db.query("select 1 from public.finance_entries where appointment_id = $1", [
      id,
    ]);
    expect(entries.rows).toEqual([]);
  });

  it("only the owner of the business sees and writes its entries", async () => {
    await db.query(
      `insert into public.finance_entries (business_id, kind, category, description, amount_cents, occurred_on)
       values ($1, 'expense', 'Aluguel', 'Aluguel de outubro', 150000, current_date)`,
      [SEED.beauty.business],
    );
    const mine = await as(db, { role: "authenticated", userId: owner }, (tx) =>
      tx.query("select 1 from public.finance_entries where business_id = $1", [
        SEED.beauty.business,
      ]),
    );
    expect(mine.rows.length).toBeGreaterThan(0);
    const theirs = await as(db, { role: "authenticated", userId: other }, (tx) =>
      tx.query("select 1 from public.finance_entries where business_id = $1", [
        SEED.beauty.business,
      ]),
    );
    expect(theirs.rows).toEqual([]);
    await expect(
      as(db, { role: "authenticated", userId: other }, (tx) =>
        tx.query(
          `insert into public.finance_entries (business_id, kind, category, description, amount_cents, occurred_on)
           values ($1, 'expense', 'X', 'X', 100, current_date)`,
          [SEED.beauty.business],
        ),
      ),
    ).rejects.toThrow();
  });
});
