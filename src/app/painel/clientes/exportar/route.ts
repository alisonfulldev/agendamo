import { NextResponse } from "next/server";

import { getBusinessContext } from "@/lib/business/context";
import { toCsv } from "@/lib/csv";
import { formatBrPhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";

/** Customers as CSV (opens in Excel pt-BR). Staff get only their own customers (RLS). */
export async function GET() {
  const context = await getBusinessContext();
  if (!context) return new NextResponse("Not found", { status: 404 });
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select(
      "name, phone, email, birthdate, marketing_opt_in, blocked, no_show_count, notes, created_at",
    )
    .eq("business_id", context.business.id)
    .order("name")
    .limit(20000);
  const csv = toCsv([
    [
      "Nome",
      "Telefone",
      "E-mail",
      "Aniversário",
      "Aceita novidades",
      "Bloqueada",
      "Faltas",
      "Observações",
      "Cadastro",
    ],
    ...(data ?? []).map((c) => [
      c.name as string,
      formatBrPhone(c.phone as string | null),
      c.email as string | null,
      c.birthdate ? (c.birthdate as string).split("-").reverse().join("/") : "",
      c.marketing_opt_in ? "sim" : "não",
      c.blocked ? "sim" : "não",
      c.no_show_count as number,
      c.notes as string | null,
      (c.created_at as string).slice(0, 10).split("-").reverse().join("/"),
    ]),
  ]);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clientes-${context.business.slug}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
