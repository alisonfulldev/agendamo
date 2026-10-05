import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { PGlite, type Transaction } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { unaccent } from "@electric-sql/pglite/contrib/unaccent";

import { SUPABASE_STUB_SQL as SUPABASE_STUB } from "../../src/lib/demo/supabase-stub";

const SUPABASE_DIR = path.join(process.cwd(), "supabase");

export function listMigrations(): string[] {
  const dir = path.join(SUPABASE_DIR, "migrations");
  return readdirSync(dir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => path.join(dir, file));
}

export interface TestDbOptions {
  seed?: boolean;
}

/** Fresh in-memory Postgres with every migration applied (and optionally supabase/seed.sql). */
export async function createTestDb({ seed = false }: TestDbOptions = {}): Promise<PGlite> {
  const db = new PGlite({ extensions: { btree_gist, unaccent } });
  await db.exec(SUPABASE_STUB);
  for (const file of listMigrations()) {
    try {
      await db.exec(readFileSync(file, "utf8"));
    } catch (error) {
      throw new Error(`Migration ${path.basename(file)} failed: ${(error as Error).message}`);
    }
  }
  if (seed) await db.exec(readFileSync(path.join(SUPABASE_DIR, "seed.sql"), "utf8"));
  return db;
}

export async function createUser(db: PGlite, id: string, email = `${id}@test.local`) {
  await db.query("insert into auth.users (id, email) values ($1, $2)", [id, email]);
}

type Actor =
  { role: "anon" } | { role: "authenticated"; userId: string } | { role: "service_role" };

/** Runs `fn` inside a transaction as a Supabase API role, like PostgREST does. Always rolled back. */
export async function as<T>(
  db: PGlite,
  actor: Actor,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  let result: T;
  let failure: unknown;
  await db
    .transaction(async (tx) => {
      await tx.exec(`set local role ${actor.role}`);
      if (actor.role === "authenticated") {
        await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [actor.userId]);
      }
      try {
        result = await fn(tx);
      } catch (error) {
        failure = error;
      }
      await tx.rollback();
    })
    .catch(() => undefined);
  if (failure) throw failure;
  return result!;
}

/** Like `as`, but commits. */
export async function asCommitted<T>(
  db: PGlite,
  actor: Actor,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${actor.role}`);
    if (actor.role === "authenticated") {
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [actor.userId]);
    }
    return fn(tx);
  });
}

export const SEED = {
  psychology: {
    business: "b0000000-0000-4000-8000-000000000001",
    professionals: ["c0000000-0000-4000-8000-000000000011", "c0000000-0000-4000-8000-000000000012"],
    resource: "d0000000-0000-4000-8000-000000000011",
    services: [
      "e0000000-0000-4000-8000-000000000011",
      "e0000000-0000-4000-8000-000000000012",
      "e0000000-0000-4000-8000-000000000013",
    ],
  },
  physio: {
    business: "b0000000-0000-4000-8000-000000000002",
    professionals: ["c0000000-0000-4000-8000-000000000021", "c0000000-0000-4000-8000-000000000022"],
    resource: "d0000000-0000-4000-8000-000000000021",
    services: [
      "e0000000-0000-4000-8000-000000000021",
      "e0000000-0000-4000-8000-000000000022",
      "e0000000-0000-4000-8000-000000000023",
    ],
  },
} as const;
