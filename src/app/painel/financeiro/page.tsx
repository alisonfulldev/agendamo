import { ptBR } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/panel/page-header";
import { Button } from "@/components/ui/button";
import { requireOwner } from "@/lib/business/context";
import {
  monthRange,
  PAYMENT_METHOD_LABELS,
  shiftMonth,
  summarize,
  type FinanceEntry,
  type PaymentMethod,
} from "@/lib/finance";
import { formatBRL } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

import { EntryForm, EntryRow } from "./entries";

export const metadata: Metadata = { title: "Financeiro" };

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

function currentMonth(timezone: string): string {
  return formatInTimeZone(new Date(), timezone, "yyyy-MM");
}

/** Revenues (automatic from completed appointments + manual), costs and profit of a month. */
export default async function FinancePage({ searchParams }: PageProps<"/painel/financeiro">) {
  const { business } = await requireOwner();
  const { mes, tipo } = await searchParams;
  const today = currentMonth(business.timezone);
  const month = typeof mes === "string" && MONTH.test(mes) ? mes : today;
  const filter = tipo === "receitas" ? "income" : tipo === "custos" ? "expense" : null;
  const { from, to } = monthRange(month);

  const supabase = await createClient();
  const [{ data }, { data: customers }] = await Promise.all([
    supabase
      .from("finance_entries")
      .select("*, customer:customers(name)")
      .eq("business_id", business.id)
      .gte("occurred_on", from)
      .lt("occurred_on", to)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase
      .from("customers")
      .select("id, name")
      .eq("business_id", business.id)
      .order("name")
      .limit(1000),
  ]);
  const entries = (data ?? []) as FinanceEntry[];
  const summary = summarize(entries);
  const shown = filter ? entries.filter((e) => e.kind === filter) : entries;
  const monthLabel = formatInTimeZone(new Date(`${month}-15T12:00:00Z`), "UTC", "MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const link = (params: { mes?: string; tipo?: string | null }) => {
    const query = new URLSearchParams();
    query.set("mes", params.mes ?? month);
    const type = params.tipo === undefined ? (typeof tipo === "string" ? tipo : null) : params.tipo;
    if (type) query.set("tipo", type);
    return `/painel/financeiro?${query.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Financeiro"
        description="Atendimentos concluídos entram como receita sozinhos. Lance também vendas avulsas e seus custos."
        actions={
          <Button asChild variant="outline" size="sm">
            <a href={`/painel/financeiro/exportar?mes=${month}`}>
              <Download /> Exportar mês
            </a>
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon" aria-label="Mês anterior">
          <Link href={link({ mes: shiftMonth(month, -1) })}>
            <ChevronLeft />
          </Link>
        </Button>
        <p className="min-w-44 text-center text-lg font-semibold">
          {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
        </p>
        <Button asChild variant="outline" size="icon" aria-label="Próximo mês">
          <Link href={link({ mes: shiftMonth(month, 1) })}>
            <ChevronRight />
          </Link>
        </Button>
        {month !== today ? (
          <Link href={link({ mes: today })} className="text-sm text-primary underline">
            Mês atual
          </Link>
        ) : null}
      </div>

      <ul className="grid gap-3 sm:grid-cols-3">
        <li className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Receitas</p>
          <p className="text-2xl font-bold">{formatBRL(summary.income)}</p>
        </li>
        <li className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Custos</p>
          <p className="text-2xl font-bold">{formatBRL(summary.expense)}</p>
        </li>
        <li className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Lucro</p>
          <p
            className={`text-2xl font-bold ${summary.profit < 0 ? "text-destructive" : "text-primary"}`}
          >
            {formatBRL(summary.profit)}
          </p>
        </li>
      </ul>

      {summary.income > 0 || summary.expense > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          <section className="rounded-xl border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold">Receitas por forma de pagamento</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {(["pix", "cash", "card", "other"] as PaymentMethod[])
                .filter((m) => summary.byMethod[m] > 0)
                .map((m) => (
                  <li key={m} className="flex justify-between">
                    <span>{PAYMENT_METHOD_LABELS[m]}</span>
                    <span className="font-medium">{formatBRL(summary.byMethod[m])}</span>
                  </li>
                ))}
              {summary.byMethod.unknown > 0 ? (
                <li className="flex justify-between text-muted-foreground">
                  <span>Sem forma de pagamento</span>
                  <span>{formatBRL(summary.byMethod.unknown)}</span>
                </li>
              ) : null}
            </ul>
          </section>
          <section className="rounded-xl border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold">Custos por categoria</h2>
            {summary.byExpenseCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum custo lançado neste mês.</p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {summary.byExpenseCategory.map((c) => (
                  <li key={c.category} className="flex justify-between">
                    <span>{c.category}</span>
                    <span className="font-medium">{formatBRL(c.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}

      <EntryForm
        // A new month (soft navigation) must reset the form's default date.
        key={month}
        defaultDate={
          month === today
            ? formatInTimeZone(new Date(), business.timezone, "yyyy-MM-dd")
            : `${month}-01`
        }
        customers={(customers ?? []) as { id: string; name: string }[]}
      />

      <section aria-labelledby="lancamentos">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="lancamentos" className="text-lg font-semibold">
            Lançamentos
          </h2>
          <nav aria-label="Filtro" className="flex gap-1 text-sm">
            {[
              [null, "Todos"],
              ["receitas", "Receitas"],
              ["custos", "Custos"],
            ].map(([value, label]) => (
              <Link
                key={label}
                href={link({ tipo: value })}
                aria-current={
                  (typeof tipo === "string" ? tipo : null) === value ? "page" : undefined
                }
                className={`rounded-lg px-3 py-1.5 ${
                  (typeof tipo === "string" ? tipo : null) === value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        {shown.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            Nenhum lançamento neste mês. Atendimentos concluídos aparecem aqui sozinhos.
          </p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {shown.map((entry) => (
              <EntryRow key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
