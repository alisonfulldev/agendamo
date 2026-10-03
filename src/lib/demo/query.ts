import "server-only";

import type { PGlite, Transaction } from "@electric-sql/pglite";

import { getCatalog, type Catalog } from "./catalog";

/**
 * A small PostgREST emulator over PGlite implementing the subset of the supabase-js query API
 * this project uses (filters, embeds, count, single, insert/update/upsert/delete, rpc).
 * Every call runs in its own transaction as the API role, so RLS behaves like on Supabase.
 */
export type Actor =
  { role: "anon" } | { role: "authenticated"; userId: string } | { role: "service_role" };

export interface DemoError {
  message: string;
  code: string;
  details: string | null;
  hint: string | null;
}

export interface DemoResponse<T = unknown> {
  data: T | null;
  error: DemoError | null;
  count: number | null;
  status: number;
  statusText: string;
}

export interface DemoContext {
  db: () => Promise<PGlite>;
  actor: () => Actor;
}

export async function runAs<T>(
  ctx: DemoContext,
  fn: (tx: Transaction, catalog: Catalog) => Promise<T>,
): Promise<T> {
  const db = await ctx.db();
  const catalog = await getCatalog(db);
  const actor = ctx.actor();
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${actor.role}`);
    if (actor.role === "authenticated") {
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [actor.userId]);
    }
    return fn(tx, catalog);
  });
}

export function toDemoError(error: unknown): DemoError {
  const e = error as { message?: string; code?: string; detail?: string; hint?: string };
  return {
    message: e.message ?? String(error),
    code: e.code ?? "XX000",
    details: e.detail ?? null,
    hint: e.hint ?? null,
  };
}

const ident = (name: string) => `"${name.replace(/"/g, '""')}"`;

function arrayLiteral(values: unknown[]): string {
  const items = values.map((value) =>
    value === null || value === undefined
      ? "NULL"
      : `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`,
  );
  return `{${items.join(",")}}`;
}

/** Values always travel as text and are cast in SQL, so PGlite never re-serializes them. */
function serialize(value: unknown, type: string | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (type === "json" || type === "jsonb") return JSON.stringify(value);
  if (Array.isArray(value)) return arrayLiteral(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

class Params {
  values: (string | null)[] = [];
  add(value: unknown, type: string | undefined): string {
    this.values.push(serialize(value, type));
    const ref = `$${this.values.length}::text`;
    return type ? `cast(${ref} as ${type})` : ref;
  }
}

// ---------------------------------------------------------------------------
// select strings: "id, name, business:businesses(*), appointment_services(name, price_cents)"

type SelectItem =
  | { kind: "star" }
  | { kind: "column"; name: string; alias: string }
  | { kind: "embed"; table: string; alias: string; hint: string | null; items: SelectItem[] };

function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of input) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

function parseSelect(input: string): SelectItem[] {
  return splitTopLevel(input.replace(/\s+/g, " ")).map((part): SelectItem => {
    if (part === "*") return { kind: "star" };
    const embed = /^(?:([\w]+)\s*:\s*)?([\w]+)(?:!([\w]+))?\s*\((.*)\)$/.exec(part);
    if (embed) {
      const [, alias, table, hint, inner] = embed;
      return {
        kind: "embed",
        table: table!,
        alias: alias ?? table!,
        hint: hint ?? null,
        items: parseSelect(inner || "*"),
      };
    }
    const column = /^(?:([\w]+)\s*:\s*)?([\w]+)(?:::[\w]+)?$/.exec(part);
    if (!column) throw new Error(`Demo: unsupported select item "${part}"`);
    return { kind: "column", name: column[2]!, alias: column[1] ?? column[2]! };
  });
}

let aliasCounter = 0;

function buildObject(catalog: Catalog, table: string, alias: string, items: SelectItem[]): string {
  const parts: string[] = [];
  const pairs: string[] = [];
  if (items.some((item) => item.kind === "star")) parts.push(`to_jsonb(${alias})`);
  for (const item of items) {
    if (item.kind === "column") pairs.push(`'${item.alias}', ${alias}.${ident(item.name)}`);
    if (item.kind === "embed")
      pairs.push(`'${item.alias}', ${buildEmbed(catalog, table, alias, item)}`);
  }
  // jsonb_build_object takes at most 100 arguments.
  for (let i = 0; i < pairs.length; i += 40) {
    parts.push(`jsonb_build_object(${pairs.slice(i, i + 40).join(", ")})`);
  }
  return parts.length > 0 ? parts.join(" || ") : "'{}'::jsonb";
}

function pickForeignKey(
  candidates: Catalog["foreignKeys"],
  hint: string | null,
  alias: string,
): Catalog["foreignKeys"][number] | undefined {
  if (candidates.length <= 1) return candidates[0];
  if (hint) {
    const byHint = candidates.find((fk) => fk.name === hint || fk.childCols.includes(hint));
    if (byHint) return byHint;
  }
  return (
    candidates.find((fk) => fk.childCols[0] === `${alias}_id`) ??
    candidates.find((fk) => fk.childCols.length === 1) ??
    candidates[0]
  );
}

function buildEmbed(
  catalog: Catalog,
  table: string,
  alias: string,
  item: Extract<SelectItem, { kind: "embed" }>,
): string {
  const inner = `e${++aliasCounter}`;
  const target = `public.${ident(item.table)} ${inner}`;
  const toOne = pickForeignKey(
    catalog.foreignKeys.filter((fk) => fk.child === table && fk.parent === item.table),
    item.hint,
    item.alias,
  );
  if (toOne) {
    const on = toOne.childCols
      .map((col, i) => `${inner}.${ident(toOne.parentCols[i]!)} = ${alias}.${ident(col)}`)
      .join(" and ");
    return `(select ${buildObject(catalog, item.table, inner, item.items)} from ${target} where ${on} limit 1)`;
  }
  const toMany = pickForeignKey(
    catalog.foreignKeys.filter((fk) => fk.child === item.table && fk.parent === table),
    item.hint,
    table.replace(/s$/, ""),
  );
  if (!toMany) throw new Error(`Demo: no relationship between ${table} and ${item.table}`);
  const on = toMany.childCols
    .map((col, i) => `${inner}.${ident(col)} = ${alias}.${ident(toMany.parentCols[i]!)}`)
    .join(" and ");
  const object = buildObject(catalog, item.table, inner, item.items);
  const isOneToOne = (catalog.uniqueSets.get(item.table) ?? []).some(
    (set) =>
      set.length === toMany.childCols.length && set.every((c) => toMany.childCols.includes(c)),
  );
  if (isOneToOne) return `(select ${object} from ${target} where ${on} limit 1)`;
  return `coalesce((select jsonb_agg(${object}) from ${target} where ${on}), '[]'::jsonb)`;
}

// ---------------------------------------------------------------------------

type Filter = (params: Params, columnType: (column: string) => string | undefined) => string;

type Operation =
  | { kind: "select" }
  | { kind: "insert"; rows: Record<string, unknown>[] }
  | {
      kind: "upsert";
      rows: Record<string, unknown>[];
      onConflict: string | null;
      ignoreDuplicates: boolean;
    }
  | { kind: "update"; values: Record<string, unknown> }
  | { kind: "delete" };

const OPERATORS: Record<string, string> = {
  eq: "=",
  neq: "<>",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
};

export class DemoQueryBuilder implements PromiseLike<DemoResponse> {
  private operation: Operation = { kind: "select" };
  private selectString: string | null = null;
  private filters: Filter[] = [];
  private orders: { column: string; ascending: boolean; nullsFirst?: boolean }[] = [];
  private limitCount: number | null = null;
  private offsetCount: number | null = null;
  private countMode: "exact" | null = null;
  private head = false;
  private singleMode: "single" | "maybeSingle" | null = null;

  constructor(
    private readonly ctx: DemoContext,
    private readonly table: string,
  ) {}

  select(columns = "*", options?: { count?: "exact" | "planned" | "estimated"; head?: boolean }) {
    this.selectString = columns;
    if (options?.count) this.countMode = "exact";
    if (options?.head) this.head = true;
    return this;
  }

  insert(values: Record<string, unknown> | Record<string, unknown>[]) {
    this.operation = { kind: "insert", rows: Array.isArray(values) ? values : [values] };
    return this;
  }

  upsert(
    values: Record<string, unknown> | Record<string, unknown>[],
    options?: { onConflict?: string; ignoreDuplicates?: boolean },
  ) {
    this.operation = {
      kind: "upsert",
      rows: Array.isArray(values) ? values : [values],
      onConflict: options?.onConflict ?? null,
      ignoreDuplicates: options?.ignoreDuplicates ?? false,
    };
    return this;
  }

  update(values: Record<string, unknown>) {
    this.operation = { kind: "update", values };
    return this;
  }

  delete() {
    this.operation = { kind: "delete" };
    return this;
  }

  private compare(column: string, operator: string, value: unknown) {
    this.filters.push(
      (params, type) => `t0.${ident(column)} ${operator} ${params.add(value, type(column))}`,
    );
    return this;
  }

  eq(column: string, value: unknown) {
    return this.compare(column, OPERATORS.eq!, value);
  }
  neq(column: string, value: unknown) {
    return this.compare(column, OPERATORS.neq!, value);
  }
  gt(column: string, value: unknown) {
    return this.compare(column, OPERATORS.gt!, value);
  }
  gte(column: string, value: unknown) {
    return this.compare(column, OPERATORS.gte!, value);
  }
  lt(column: string, value: unknown) {
    return this.compare(column, OPERATORS.lt!, value);
  }
  lte(column: string, value: unknown) {
    return this.compare(column, OPERATORS.lte!, value);
  }

  like(column: string, pattern: string) {
    this.filters.push(
      (params) => `t0.${ident(column)}::text like ${params.add(pattern, undefined)}`,
    );
    return this;
  }

  ilike(column: string, pattern: string) {
    this.filters.push(
      (params) => `t0.${ident(column)}::text ilike ${params.add(pattern, undefined)}`,
    );
    return this;
  }

  in(column: string, values: readonly unknown[]) {
    this.filters.push((params, type) => {
      const base = type(column);
      return `t0.${ident(column)} = any(${params.add([...values], base ? `${base}[]` : "text[]")})`;
    });
    return this;
  }

  is(column: string, value: null | boolean) {
    this.filters.push(
      () => `t0.${ident(column)} is ${value === null ? "null" : value ? "true" : "false"}`,
    );
    return this;
  }

  not(column: string, operator: string, value: unknown) {
    this.filters.push((params, type) => {
      if (operator === "is") {
        return `t0.${ident(column)} is not ${value === null ? "null" : value ? "true" : "false"}`;
      }
      const sqlOperator = OPERATORS[operator];
      if (!sqlOperator) throw new Error(`Demo: unsupported not() operator "${operator}"`);
      return `not (t0.${ident(column)} ${sqlOperator} ${params.add(value, type(column))})`;
    });
    return this;
  }

  contains(column: string, value: unknown) {
    this.filters.push(
      (params, type) => `t0.${ident(column)} @> ${params.add(value, type(column) ?? "jsonb")}`,
    );
    return this;
  }

  match(query: Record<string, unknown>) {
    for (const [column, value] of Object.entries(query)) this.eq(column, value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
    this.orders.push({
      column,
      ascending: options?.ascending ?? true,
      nullsFirst: options?.nullsFirst,
    });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    return this;
  }

  single() {
    this.singleMode = "single";
    return this;
  }

  maybeSingle() {
    this.singleMode = "maybeSingle";
    return this;
  }

  then<TResult1 = DemoResponse, TResult2 = never>(
    onfulfilled?: ((value: DemoResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<DemoResponse> {
    try {
      const { rows, count } = await runAs(this.ctx, (tx, catalog) => this.run(tx, catalog));
      return finish(rows, count, this.singleMode, this.head, this.operation.kind);
    } catch (error) {
      return { data: null, error: toDemoError(error), count: null, status: 400, statusText: "" };
    }
  }

  private async run(tx: Transaction, catalog: Catalog) {
    const columns = catalog.columns.get(this.table);
    if (!columns)
      throw Object.assign(new Error(`relation "${this.table}" does not exist`), { code: "42P01" });
    const type = (column: string) => columns.get(column);
    const params = new Params();
    const table = `public.${ident(this.table)}`;
    const where = this.filters.map((filter) => filter(params, type));
    const whereSql = where.length > 0 ? ` where ${where.join(" and ")}` : "";
    const object = this.selectString
      ? buildObject(catalog, this.table, "t0", parseSelect(this.selectString))
      : null;

    let sql: string;
    const op = this.operation;
    if (op.kind === "select") {
      const order = this.orders
        .map(
          (o) =>
            `t0.${ident(o.column)} ${o.ascending ? "asc" : "desc"}${
              o.nullsFirst === undefined ? "" : o.nullsFirst ? " nulls first" : " nulls last"
            }`,
        )
        .join(", ");
      let count: number | null = null;
      if (this.countMode) {
        const countParams = new Params();
        const countWhere = this.filters.map((filter) => filter(countParams, type));
        const result = await tx.query<{ c: number }>(
          `select count(*)::int as c from ${table} t0${countWhere.length ? ` where ${countWhere.join(" and ")}` : ""}`,
          countParams.values,
        );
        count = result.rows[0]?.c ?? 0;
        if (this.head) return { rows: [], count };
      }
      sql = `select ${object ?? "to_jsonb(t0)"} as r from ${table} t0${whereSql}${
        order ? ` order by ${order}` : ""
      }${this.limitCount !== null ? ` limit ${Number(this.limitCount)}` : ""}${
        this.offsetCount !== null ? ` offset ${Number(this.offsetCount)}` : ""
      }`;
      const result = await tx.query<{ r: unknown }>(sql, params.values);
      return { rows: result.rows.map((row) => row.r), count };
    }

    let statement: string;
    if (op.kind === "insert" || op.kind === "upsert") {
      const rows = op.rows.map((row) =>
        Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined)),
      );
      const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
      if (keys.length === 0) {
        statement = `insert into ${table} default values`;
      } else {
        const values = rows
          .map(
            (row) =>
              `(${keys.map((key) => (key in row ? params.add(row[key], type(key)) : "default")).join(", ")})`,
          )
          .join(", ");
        statement = `insert into ${table} as t0 (${keys.map(ident).join(", ")}) values ${values}`;
      }
      if (op.kind === "upsert") {
        const conflict = op.onConflict
          ? op.onConflict.split(",").map((c) => c.trim())
          : (catalog.primaryKeys.get(this.table) ?? []);
        const updates = keys.filter((key) => !conflict.includes(key));
        statement += ` on conflict (${conflict.map(ident).join(", ")}) ${
          op.ignoreDuplicates || updates.length === 0
            ? "do nothing"
            : `do update set ${updates.map((k) => `${ident(k)} = excluded.${ident(k)}`).join(", ")}`
        }`;
      }
    } else if (op.kind === "update") {
      const sets = Object.entries(op.values)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${ident(key)} = ${params.add(value, type(key))}`);
      // Filters were rendered first, so their placeholders keep their numbers.
      statement = `update ${table} t0 set ${sets.join(", ")}${whereSql}`;
    } else {
      statement = `delete from ${table} t0${whereSql}`;
    }

    if (!object) {
      const result = await tx.query(statement, params.values);
      return { rows: null as unknown[] | null, count: result.affectedRows ?? null };
    }
    sql = `with m as (${statement} returning *) select ${object} as r from m t0`;
    const result = await tx.query<{ r: unknown }>(sql, params.values);
    return { rows: result.rows.map((row) => row.r), count: null };
  }
}

function finish(
  rows: unknown[] | null,
  count: number | null,
  singleMode: "single" | "maybeSingle" | null,
  head: boolean,
  kind: Operation["kind"],
): DemoResponse {
  const ok = (data: unknown): DemoResponse => ({
    data,
    error: null,
    count: kind === "select" ? count : null,
    status: kind === "insert" || kind === "upsert" ? 201 : 200,
    statusText: "OK",
  });
  if (head) return ok(null);
  if (rows === null) return { ...ok(null), status: 204 };
  if (singleMode) {
    if (rows.length === 1) return ok(rows[0]);
    if (rows.length === 0 && singleMode === "maybeSingle") return ok(null);
    return {
      data: null,
      error: {
        message: "JSON object requested, multiple (or no) rows returned",
        code: "PGRST116",
        details: `The result contains ${rows.length} rows`,
        hint: null,
      },
      count: null,
      status: 406,
      statusText: "Not Acceptable",
    };
  }
  return ok(rows);
}

// ---------------------------------------------------------------------------

export class DemoRpcBuilder implements PromiseLike<DemoResponse> {
  private singleMode: "single" | "maybeSingle" | null = null;

  constructor(
    private readonly ctx: DemoContext,
    private readonly fn: string,
    private readonly args: Record<string, unknown>,
  ) {}

  single() {
    this.singleMode = "single";
    return this;
  }

  maybeSingle() {
    this.singleMode = "maybeSingle";
    return this;
  }

  then<TResult1 = DemoResponse, TResult2 = never>(
    onfulfilled?: ((value: DemoResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<DemoResponse> {
    try {
      const data = await runAs(this.ctx, async (tx, catalog) => {
        const info = catalog.functions.get(this.fn);
        if (!info) {
          throw Object.assign(new Error(`Could not find the function public.${this.fn}`), {
            code: "PGRST202",
          });
        }
        const params = new Params();
        const args = Object.entries(this.args)
          .filter(([, value]) => value !== undefined)
          .map(([name, value]) => `${ident(name)} => ${params.add(value, info.args.get(name))}`)
          .join(", ");
        const call = `public.${ident(this.fn)}(${args})`;
        if (info.kind === "void") {
          await tx.query(`select ${call}`, params.values);
          return null;
        }
        if (info.kind === "scalar" && !info.returnsSet) {
          const result = await tx.query<{ r: unknown }>(
            `select to_jsonb(${call}) as r`,
            params.values,
          );
          return result.rows[0]?.r ?? null;
        }
        const result = await tx.query<{ r: unknown }>(
          `select to_jsonb(f) as r from ${call} f`,
          params.values,
        );
        const rows = result.rows.map((row) => row.r);
        return info.returnsSet ? rows : (rows[0] ?? null);
      });
      if (this.singleMode) {
        const rows = Array.isArray(data) ? data : data === null ? [] : [data];
        return finish(rows, null, this.singleMode, false, "select");
      }
      return { data, error: null, count: null, status: 200, statusText: "OK" };
    } catch (error) {
      return { data: null, error: toDemoError(error), count: null, status: 400, statusText: "" };
    }
  }
}
