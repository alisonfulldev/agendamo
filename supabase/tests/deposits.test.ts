import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { as, createTestDb, createUser, SEED } from "./harness";

let db: PGlite;
const owner = "a0000000-0000-4000-8000-0000000000d1";
const intruder = "a0000000-0000-4000-8000-0000000000d2";
const business = SEED.psychology.business;
const professional = SEED.psychology.professionals[0];

beforeAll(async () => {
  db = await createTestDb({ seed: true });
  await createUser(db, owner);
  await createUser(db, intruder);
  await db.query(
    "insert into public.members (business_id, user_id, role) values ($1, $2, 'owner')",
    [business, owner],
  );
  await db.query(
    "insert into public.members (business_id, user_id, role) values ($1, $2, 'owner')",
    [SEED.physio.business, intruder],
  );
});

let hour = 0;
/** An appointment waiting for its deposit (each one at a different future time). */
async function waitingDeposit(cents: number, status = "waiting") {
  hour += 2;
  const customer = await db.query<{ id: string }>(
    "insert into public.customers (business_id, name) values ($1, 'Cliente do sinal') returning id",
    [business],
  );
  const created = await db.query<{ id: string }>(
    `insert into public.appointments (business_id, professional_id, customer_id, starts_at, ends_at, status, source, deposit_cents, deposit_status, deposit_expires_at)
     values ($1, $2, $3, now() + make_interval(days => 30, hours => $4::int), now() + make_interval(days => 30, hours => $4::int, mins => 30),
       'awaiting_deposit', 'chat', $5, $6, now() + interval '20 minutes')
     returning id`,
    [business, professional, customer.rows[0]!.id, hour, cents, status],
  );
  return created.rows[0]!.id;
}

describe("deposits by Pix with receipts", () => {
  it("unique cents: two pending payments of the same professional never share an amount", async () => {
    await waitingDeposit(2993);
    await expect(waitingDeposit(2993)).rejects.toThrow();
    await expect(waitingDeposit(2993, "sent")).rejects.toThrow();
  });

  it("the amount is free again once the payment is decided or expired", async () => {
    const id = await waitingDeposit(2991);
    await db.query(
      "update public.appointments set status = 'cancelled', deposit_status = 'expired' where id = $1",
      [id],
    );
    await expect(waitingDeposit(2991)).resolves.toBeTruthy();
  });

  it("only the known payment statuses and deposit types are accepted", async () => {
    const id = await waitingDeposit(2989);
    await expect(
      db.query("update public.appointments set deposit_status = 'informed' where id = $1", [id]),
    ).rejects.toThrow();
    await expect(
      db.query(
        "update public.services set deposit_type = 'full', deposit_value = 0 where business_id = $1",
        [business],
      ),
    ).resolves.toBeTruthy();
  });

  it("the same receipt file (hash) is refused in another appointment", async () => {
    const first = await waitingDeposit(2987);
    const second = await waitingDeposit(2985);
    const hash = "b".repeat(64);
    await db.query(
      "insert into public.deposit_receipts (business_id, appointment_id, sha256, status) values ($1, $2, $3, 'received')",
      [business, first, hash],
    );
    await expect(
      db.query(
        "insert into public.deposit_receipts (business_id, appointment_id, sha256, status) values ($1, $2, $3, 'received')",
        [business, second, hash],
      ),
    ).rejects.toThrow();
  });

  it("receipt keys are random paths only (no business or appointment id)", async () => {
    const id = await waitingDeposit(2983);
    await expect(
      db.query(
        "insert into public.deposit_receipts (business_id, appointment_id, object_key) values ($1, $2, $3)",
        [business, id, `receipts/${business}.jpg`],
      ),
    ).rejects.toThrow();
    await expect(
      db.query(
        "insert into public.deposit_receipts (business_id, appointment_id, object_key) values ($1, $2, $3)",
        [business, id, `receipts/${"a1".repeat(16)}.pdf`],
      ),
    ).resolves.toBeTruthy();
  });

  it("only the owner of the business can read its receipts (RLS)", async () => {
    const mine = await as(db, { role: "authenticated", userId: owner }, (tx) =>
      tx.query("select id from public.deposit_receipts where business_id = $1", [business]),
    );
    const theirs = await as(db, { role: "authenticated", userId: intruder }, (tx) =>
      tx.query("select id from public.deposit_receipts where business_id = $1", [business]),
    );
    expect(mine.rows.length).toBeGreaterThan(0);
    expect(theirs.rows).toEqual([]);
  });
});
