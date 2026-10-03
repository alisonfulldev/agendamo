import { NextResponse, type NextRequest } from "next/server";

import { audit } from "@/lib/audit";
import { getBusinessContext } from "@/lib/business/context";
import { toCsv } from "@/lib/csv";
import { createAdminClient } from "@/lib/supabase/admin";

/** Business tables included in the export (everything the business owns). */
const TABLES = [
  "businesses",
  "page_settings",
  "page_links",
  "page_photos",
  "professionals",
  "services",
  "professional_services",
  "resources",
  "service_resources",
  "working_hours",
  "time_off",
  "customers",
  "appointments",
  "appointment_services",
  "appointment_resources",
  "booking_requests",
  "abandoned_bookings",
  "waitlist_entries",
  "reviews",
  "referrals",
  "packages",
  "customer_packages",
  "combos",
  "combo_services",
  "business_coupons",
  "page_stats_daily",
  "marketing_settings",
  "subscriptions",
  "custom_domains",
  "audit_log",
] as const;

type Table = (typeof TABLES)[number];

async function rows(table: Table, businessId: string): Promise<Record<string, unknown>[]> {
  const admin = createAdminClient();
  const column = table === "businesses" ? "id" : "business_id";
  const all: Record<string, unknown>[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from(table)
      .select("*")
      .eq(column, businessId)
      .range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    all.push(...((data ?? []) as Record<string, unknown>[]));
    if (!data || data.length < 1000) break;
  }
  return all;
}

/**
 * LGPD data export (Prompt 40). ?formato=json downloads everything; ?formato=csv&tabela=<name>
 * downloads one table as CSV. Owner only; recorded in audit_log.
 */
export async function GET(request: NextRequest) {
  const context = await getBusinessContext();
  if (!context?.isOwner) return new NextResponse("Not found", { status: 404 });
  const { business, user } = context;
  const format = request.nextUrl.searchParams.get("formato") === "csv" ? "csv" : "json";
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const table = request.nextUrl.searchParams.get("tabela") as Table | null;
    if (!table || !TABLES.includes(table))
      return new NextResponse("Tabela inválida", { status: 400 });
    const data = await rows(table, business.id);
    const columns = [...new Set(data.flatMap((row) => Object.keys(row)))];
    const csv = toCsv([
      columns,
      ...data.map((row) =>
        columns.map((c) =>
          typeof row[c] === "object" && row[c] !== null
            ? JSON.stringify(row[c])
            : (row[c] as string),
        ),
      ),
    ]);
    await audit({
      businessId: business.id,
      userId: user.id,
      action: "data.exported",
      details: { format: "csv", table },
    });
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${business.slug}-${table}-${stamp}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const data: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    business_id: business.id,
  };
  for (const table of TABLES) data[table] = await rows(table, business.id);
  await audit({
    businessId: business.id,
    userId: user.id,
    action: "data.exported",
    details: { format: "json" },
  });
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${business.slug}-dados-${stamp}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
