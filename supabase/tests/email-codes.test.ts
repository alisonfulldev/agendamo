import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { as, createTestDb } from "./harness";

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb();
  await db.query(
    "insert into auth.users (id, email) values ('a0000000-0000-4000-8000-0000000000aa', 'ana@exemplo.com')",
  );
}, 60_000);

describe("sign-in by e-mail code", () => {
  it("knows whether an e-mail already has an account (any case)", async () => {
    const has = await db.query<{ v: boolean }>(
      "select public.email_has_account('ANA@exemplo.com') as v",
    );
    const none = await db.query<{ v: boolean }>(
      "select public.email_has_account('nova@exemplo.com') as v",
    );
    expect(has.rows[0]!.v).toBe(true);
    expect(none.rows[0]!.v).toBe(false);
  });

  it("keeps codes server only", async () => {
    await expect(
      as(db, { role: "anon" }, (tx) => tx.query("select * from public.email_codes")),
    ).rejects.toThrow();
    await expect(
      as(db, { role: "anon" }, (tx) =>
        tx.query("select public.email_has_account('ana@exemplo.com')"),
      ),
    ).rejects.toThrow();
  });

  it("stores e-mails in lowercase only and the cleanup drops old rows", async () => {
    await expect(
      db.query("insert into public.email_codes (email) values ('Ana@Exemplo.com')"),
    ).rejects.toThrow();
    await db.query(
      `insert into public.email_codes (email, sent_at) values
         ('velho@exemplo.com', now() - interval '2 days'), ('novo@exemplo.com', now())`,
    );
    const purged = await db.query<{ n: number }>("select public.purge_email_codes() as n");
    expect(purged.rows[0]!.n).toBe(1);
    const left = await db.query<{ email: string }>("select email from public.email_codes");
    expect(left.rows.map((r) => r.email)).toEqual(["novo@exemplo.com"]);
  });
});
