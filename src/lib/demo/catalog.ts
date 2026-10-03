import "server-only";

import type { PGlite } from "@electric-sql/pglite";

/** Table, foreign key and function metadata read once from pg_catalog (demo mode only). */
export interface ForeignKey {
  name: string;
  child: string;
  childCols: string[];
  parent: string;
  parentCols: string[];
}

export interface FunctionInfo {
  args: Map<string, string>;
  returnsSet: boolean;
  /** "void", "scalar" or "composite" (a row type, including RETURNS TABLE). */
  kind: "void" | "scalar" | "composite";
}

export interface Catalog {
  columns: Map<string, Map<string, string>>;
  primaryKeys: Map<string, string[]>;
  uniqueSets: Map<string, string[][]>;
  foreignKeys: ForeignKey[];
  functions: Map<string, FunctionInfo>;
}

const cache = new WeakMap<PGlite, Promise<Catalog>>();

export function getCatalog(db: PGlite): Promise<Catalog> {
  let hit = cache.get(db);
  if (!hit) {
    hit = load(db);
    cache.set(db, hit);
  }
  return hit;
}

/** Drops the cached metadata (after a migration changed the schema). */
export function forgetCatalog(db: PGlite): void {
  cache.delete(db);
}

async function load(db: PGlite): Promise<Catalog> {
  const columns = new Map<string, Map<string, string>>();
  const cols = await db.query<{ rel: string; col: string; type: string }>(`
    select c.relname as rel, a.attname as col, format_type(a.atttypid, a.atttypmod) as type
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'p') and a.attnum > 0 and not a.attisdropped
  `);
  for (const row of cols.rows) {
    if (!columns.has(row.rel)) columns.set(row.rel, new Map());
    columns.get(row.rel)!.set(row.col, row.type);
  }

  const primaryKeys = new Map<string, string[]>();
  const uniqueSets = new Map<string, string[][]>();
  const foreignKeys: ForeignKey[] = [];
  const constraints = await db.query<{
    name: string;
    type: string;
    child: string;
    parent: string | null;
    child_cols: string[];
    parent_cols: string[] | null;
  }>(`
    select con.conname as name, con.contype as type, c.relname as child, p.relname as parent,
      array(
        select a.attname from unnest(con.conkey) with ordinality k(attnum, ord)
        join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k.attnum order by k.ord
      ) as child_cols,
      case when con.contype = 'f' then array(
        select a.attname from unnest(con.confkey) with ordinality k(attnum, ord)
        join pg_attribute a on a.attrelid = con.confrelid and a.attnum = k.attnum order by k.ord
      ) end as parent_cols
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_class p on p.oid = con.confrelid
    where n.nspname = 'public' and con.contype in ('p', 'u', 'f')
    order by con.conname
  `);
  for (const row of constraints.rows) {
    if (row.type === "p") primaryKeys.set(row.child, row.child_cols);
    if (row.type === "p" || row.type === "u") {
      if (!uniqueSets.has(row.child)) uniqueSets.set(row.child, []);
      uniqueSets.get(row.child)!.push(row.child_cols);
    }
    if (row.type === "f" && row.parent && row.parent_cols) {
      foreignKeys.push({
        name: row.name,
        child: row.child,
        childCols: row.child_cols,
        parent: row.parent,
        parentCols: row.parent_cols,
      });
    }
  }

  const functions = new Map<string, FunctionInfo>();
  const procs = await db.query<{
    name: string;
    returns_set: boolean;
    ret_type: string;
    ret_kind: string;
    arg_names: string[] | null;
    arg_modes: string[] | null;
    arg_types: string[];
  }>(`
    select p.proname as name, p.proretset as returns_set, format_type(p.prorettype, null) as ret_type,
      t.typtype as ret_kind, p.proargnames as arg_names, p.proargmodes::text[] as arg_modes,
      array(
        select format_type(x, null)
        from unnest(coalesce(p.proallargtypes, p.proargtypes::oid[])) with ordinality u(x, ord)
        order by u.ord
      ) as arg_types
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    join pg_type t on t.oid = p.prorettype
    where n.nspname = 'public'
  `);
  for (const row of procs.rows) {
    const args = new Map<string, string>();
    row.arg_types.forEach((type, index) => {
      const mode = row.arg_modes?.[index] ?? "i";
      const name = row.arg_names?.[index];
      if (name && (mode === "i" || mode === "b" || mode === "v")) args.set(name, type);
    });
    const hasOut = (row.arg_modes ?? []).some((mode) => mode === "o" || mode === "t");
    functions.set(row.name, {
      args,
      returnsSet: row.returns_set,
      kind:
        row.ret_type === "void"
          ? "void"
          : row.ret_kind === "c" || row.ret_type === "record" || hasOut
            ? "composite"
            : "scalar",
    });
  }

  return { columns, primaryKeys, uniqueSets, foreignKeys, functions };
}
