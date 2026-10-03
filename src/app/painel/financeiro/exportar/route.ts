import { NextResponse, type NextRequest } from "next/server";

import { getBusinessContext } from "@/lib/business/context";
import { toCsv } from "@/lib/csv";
import { monthRange, PAYMENT_METHOD_LABELS, type FinanceEntry } from "@/lib/finance";
import { formatAmount } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

/** Entries of a month as CSV (opens in Excel pt-BR). Owner only (RLS). */
export async function GET(request: NextRequest) {
  const context = await getBusinessContext();
  if (!context?.isOwner) return new NextResponse("Not found", { status: 404 });
  const month = request.nextUrl.searchParams.get("mes") ?? "";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    return new NextResponse("Bad request", { status: 400 });
  const { from, to } = monthRange(month);
  const supabase = await createClient();
  const { data } = await supabase
    .from("finance_entries")
    .select("*, customer:customers(name)")
    .eq("business_id", context.business.id)
    .gte("occurred_on", from)
    .lt("occurred_on", to)
    .order("occurred_on");
  const csv = toCsv([
    ["Data", "Tipo", "Categoria", "Descrição", "Cliente", "Forma de pagamento", "Valor (R$)"],
    ...((data ?? []) as FinanceEntry[]).map((e) => [
      e.occurred_on.split("-").reverse().join("/"),
      e.kind === "income" ? "Receita" : "Custo",
      e.category,
      e.description,
      e.customer?.name ?? "",
      e.payment_method ? PAYMENT_METHOD_LABELS[e.payment_method] : "",
      `${e.kind === "expense" ? "-" : ""}${formatAmount(e.amount_cents)}`,
    ]),
  ]);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="financeiro-${context.business.slug}-${month}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
