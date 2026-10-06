import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { as, createTestDb } from "./harness";

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb();
}, 60_000);

describe("demonstrations of the creation conversation", () => {
  it("expire in 7 days by default", async () => {
    const { rows } = await db.query<{ days: number }>(
      `insert into public.demos (name, brand_key) values ('Barbearia do Zé', 'barber')
       returning extract(day from expires_at - created_at)::int as days`,
    );
    expect(rows[0]!.days).toBe(7);
  });

  it("are invisible to visitors and signed-in users (server only)", async () => {
    await expect(
      as(db, { role: "anon" }, (tx) => tx.query("select * from public.demos")),
    ).rejects.toThrow();
    await expect(
      as(db, { role: "anon" }, (tx) =>
        tx.query("insert into public.demos (name, brand_key) values ('X', 'general')"),
      ),
    ).rejects.toThrow();
  });

  it("the daily cleanup removes only expired ones and returns their photos", async () => {
    await db.query(
      `insert into public.demos (name, brand_key, photo_key, expires_at)
       values ('Vencida', 'nails', 'demos/x/photo.webp', now() - interval '1 minute')`,
    );
    const purged = await db.query<{ photo_key: string | null }>(
      "select * from public.purge_expired_demos()",
    );
    expect(purged.rows).toEqual([{ photo_key: "demos/x/photo.webp" }]);
    const left = await db.query<{ name: string }>("select name from public.demos");
    expect(left.rows.map((r) => r.name)).toEqual(["Barbearia do Zé"]);
    // Running again changes nothing (idempotent).
    const again = await db.query("select * from public.purge_expired_demos()");
    expect(again.rows).toEqual([]);
  });
});
