import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { createTestDb } from "../../../supabase/tests/harness";

vi.mock("server-only", () => ({}));
// Seeded avatars are not written to .demo-data while testing.
vi.mock("./storage", () => ({ writeDemoObject: () => undefined }));

const { seedDemo, DEMO_PERSONAS } = await import("./seed");
const { DemoQueryBuilder, DemoRpcBuilder } = await import("./query");
type Actor = import("./query").Actor;

let db: PGlite;

function client(actor: Actor) {
  const ctx = { db: async () => db, actor: () => actor };
  return {
    from: (table: string) => new DemoQueryBuilder(ctx, table),
    rpc: (fn: string, args: Record<string, unknown> = {}) => new DemoRpcBuilder(ctx, fn, args),
  };
}

const admin = () => client({ role: "service_role" });

beforeAll(async () => {
  db = await createTestDb();
  await seedDemo(db);
});

describe("demo seed", () => {
  it("creates every business, persona and sample data", async () => {
    const { data } = await admin().from("businesses").select("slug, brand_key, plan");
    expect((data as { slug: string }[]).map((b) => b.slug).sort()).toEqual([
      "barbearia-navalha",
      "clinica-pele",
      "esmalteria-flor",
      "espaco-escuta",
      "movimento-fisio",
      "salao-aurora",
      "studio-bela",
    ]);
    const users = await db.query<{ email: string }>("select email from auth.users");
    const emails = users.rows.map((u) => u.email);
    for (const persona of DEMO_PERSONAS) expect(emails).toContain(persona.email);
    const { count } = await admin()
      .from("appointments")
      .select("id", { count: "exact", head: true });
    expect(count).toBeGreaterThan(50);
    const stats = await db.query("select 1 from public.page_stats_daily");
    expect(stats.rows.length).toBeGreaterThan(100);
  });
});

describe("demo query builder", () => {
  it("embeds to-one and to-many relations", async () => {
    const { data, error } = await admin()
      .from("appointments")
      .select(
        "id, status, customer:customers(name), professional:professionals(id, name), appointment_services(name, price_cents)",
      )
      .eq("status", "confirmed")
      .order("starts_at", { ascending: true })
      .limit(2);
    expect(error).toBeNull();
    const rows = data as {
      customer: { name: string };
      professional: { name: string };
      appointment_services: { name: string }[];
    }[];
    expect(rows).toHaveLength(2);
    expect(typeof rows[0]!.customer.name).toBe("string");
    expect(typeof rows[0]!.professional.name).toBe("string");
    expect(rows[0]!.appointment_services.length).toBeGreaterThan(0);
  });

  it("supports filters, single and maybeSingle", async () => {
    const one = await admin().from("businesses").select("*").eq("slug", "studio-bela").single();
    expect((one.data as { name: string }).name).toBe("Studio Bela");
    const none = await admin()
      .from("businesses")
      .select("id")
      .eq("slug", "nao-existe")
      .maybeSingle();
    expect(none).toMatchObject({ data: null, error: null });
    const many = await admin().from("businesses").select("id").single();
    expect(many.error?.code).toBe("PGRST116");
    const list = await admin()
      .from("businesses")
      .select("slug")
      .in("slug", ["studio-bela", "clinica-pele"])
      .not("suspended_at", "is", null);
    expect(list.data).toEqual([]);
    const ilike = await admin().from("businesses").select("slug").ilike("name", "%bela%");
    expect(ilike.data).toEqual([{ slug: "studio-bela" }]);
  });

  it("inserts, upserts, updates and deletes with returning", async () => {
    const business = (
      await admin().from("businesses").select("id").eq("slug", "studio-bela").single()
    ).data as { id: string };
    const inserted = await admin()
      .from("page_links")
      .insert({ business_id: business.id, label: "Site", url: "https://exemplo.com" })
      .select("id, label")
      .single();
    expect(inserted.error).toBeNull();
    const id = (inserted.data as { id: string }).id;
    const updated = await admin()
      .from("page_links")
      .update({ label: "Meu site" })
      .eq("id", id)
      .select("label")
      .single();
    expect(updated.data).toEqual({ label: "Meu site" });
    const upserted = await admin()
      .from("marketing_settings")
      .upsert({ business_id: business.id, inactive_days: 90 }, { onConflict: "business_id" })
      .select("inactive_days")
      .single();
    expect(upserted.data).toEqual({ inactive_days: 90 });
    const deleted = await admin().from("page_links").delete().eq("id", id);
    expect(deleted.error).toBeNull();
  });

  it("maps database errors and applies RLS per role", async () => {
    const business = (
      await admin().from("businesses").select("id").eq("slug", "studio-bela").single()
    ).data as { id: string };
    const duplicate = await admin().from("business_coupons").insert({
      business_id: business.id,
      code: "VOLTA20",
      discount_type: "fixed",
      discount_value: 1,
    });
    expect(duplicate.error?.code).toBe("23505");
    const anon = await client({ role: "anon" }).from("customers").select("id");
    expect(anon.data ?? []).toEqual([]);
  });

  it("calls RPCs returning scalars, sets and json", async () => {
    const available = await client({ role: "anon" }).rpc("slug_is_available", {
      p_slug: "studio-bela",
    });
    expect(available).toMatchObject({ data: false, error: null });
    const page = await client({ role: "anon" }).rpc("get_public_page", { p_slug: "studio-bela" });
    expect((page.data as { business: { name: string } }).business.name).toBe("Studio Bela");
    const business = await client({ role: "anon" }).rpc("get_public_business", {
      p_slug: "studio-bela",
    });
    expect(business.data).toHaveLength(1);
  });
});
