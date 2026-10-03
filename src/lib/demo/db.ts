import "server-only";

import { mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

import type { PGlite } from "@electric-sql/pglite";

import { forgetCatalog } from "./catalog";
import { DEMO_DATA_DIR } from "./mode";
import { SUPABASE_STUB_SQL } from "./supabase-stub";

/**
 * Demo database: an embedded Postgres (PGlite, the same engine as the SQL tests) persisted in
 * .demo-data/pg. Created on first use with every migration plus demo data; later boots apply
 * only migrations it has not seen yet.
 */
const DATA_DIR = path.join(process.cwd(), DEMO_DATA_DIR, "pg");
const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");

const DEMO_SCHEMA_SQL = `
create schema demo;
create table demo.migrations (name text primary key, applied_at timestamptz not null default now());
create table demo.auth_tokens (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  created_at timestamptz not null default now()
);
`;

interface DemoGlobal {
  __livelyDemoDb?: Promise<PGlite>;
  /** Migrations applied by this process: new files are applied without a restart. */
  __livelyDemoMigrations?: number;
}
const store = globalThis as DemoGlobal;

function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();
}

async function applyMigrations(db: PGlite): Promise<void> {
  const applied = new Set(
    (await db.query<{ name: string }>("select name from demo.migrations")).rows.map((r) => r.name),
  );
  const files = migrationFiles();
  for (const file of files) {
    if (applied.has(file)) continue;
    try {
      await db.exec(readFileSync(path.join(MIGRATIONS_DIR, file), "utf8"));
    } catch (error) {
      throw new Error(`Demo: migration ${file} failed: ${(error as Error).message}`);
    }
    await db.query("insert into demo.migrations (name) values ($1)", [file]);
    forgetCatalog(db);
  }

  store.__livelyDemoMigrations = files.length;
}

async function prepare(db: PGlite): Promise<void> {
  const fresh = !(
    await db.query<{ ok: boolean }>(
      "select exists (select 1 from pg_namespace where nspname = 'demo') as ok",
    )
  ).rows[0]?.ok;
  if (fresh) {
    await db.exec(SUPABASE_STUB_SQL);
    await db.exec(DEMO_SCHEMA_SQL);
  }

  await applyMigrations(db);

  if (fresh) {
    const { seedDemo } = await import("./seed");
    await seedDemo(db);
  }
}

async function open(): Promise<PGlite> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { btree_gist } = await import("@electric-sql/pglite/contrib/btree_gist");
  const { unaccent } = await import("@electric-sql/pglite/contrib/unaccent");
  mkdirSync(DATA_DIR, { recursive: true });
  const db = await PGlite.create(DATA_DIR, { extensions: { btree_gist, unaccent } });
  await db.exec("set timezone = 'UTC'");

  try {
    await prepare(db);
  } catch (error) {
    // Never keep a half-built demo database: the next request starts over.
    await db.close().catch(() => undefined);
    rmSync(DATA_DIR, { recursive: true, force: true });
    console.error("[demo] database setup failed", error);
    throw error;
  }
  return db;
}

export function getDemoDb(): Promise<PGlite> {
  const current = store.__livelyDemoDb;
  if (current) {
    if (migrationFiles().length !== store.__livelyDemoMigrations) {
      store.__livelyDemoMigrations = migrationFiles().length;
      store.__livelyDemoDb = current.then(async (db) => {
        await applyMigrations(db);
        return db;
      });
    }
    return store.__livelyDemoDb!;
  }
  store.__livelyDemoDb ??= open().catch((error: unknown) => {
    store.__livelyDemoDb = undefined;
    throw error;
  });
  return store.__livelyDemoDb;
}

/** Deletes the demo database; the next request recreates it with fresh demo data. */
export async function resetDemoDb(): Promise<void> {
  const current = store.__livelyDemoDb;
  store.__livelyDemoDb = undefined;
  if (current) {
    try {
      await (await current).close();
    } catch {
      // Already closed or never opened.
    }
  }
  rmSync(DATA_DIR, { recursive: true, force: true });
}
