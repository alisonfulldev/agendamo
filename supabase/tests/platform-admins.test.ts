import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { as, createTestDb, createUser } from "./harness";

let db: PGlite;
const admin = "00000000-0000-4000-8000-0000000000a1";
const someone = "00000000-0000-4000-8000-0000000000a2";

beforeAll(async () => {
  db = await createTestDb();
  await createUser(db, admin);
  await createUser(db, someone);
  await db.query("insert into public.platform_admins (user_id) values ($1)", [admin]);
});

describe("platform_admins", () => {
  it("is never readable or writable from the browser (only the server)", async () => {
    for (const userId of [admin, someone]) {
      await expect(
        as(db, { role: "authenticated", userId }, (tx) =>
          tx.query("select user_id from public.platform_admins"),
        ),
      ).rejects.toThrow();
      await expect(
        as(db, { role: "authenticated", userId }, (tx) =>
          tx.query("insert into public.platform_admins (user_id) values ($1)", [userId]),
        ),
      ).rejects.toThrow();
    }
    await expect(
      as(db, { role: "anon" }, (tx) => tx.query("select user_id from public.platform_admins")),
    ).rejects.toThrow();
  });

  it("the server sees the admins", async () => {
    const { rows } = await as(db, { role: "service_role" }, (tx) =>
      tx.query<{ user_id: string }>("select user_id from public.platform_admins"),
    );
    expect(rows.map((r) => r.user_id)).toEqual([admin]);
  });
});
