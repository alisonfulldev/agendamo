import { formatInTimeZone } from "date-fns-tz";
import Link from "next/link";

import { NICHES } from "@/brands";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/money";
import { PLAN_PRICES, TIER_NAME } from "@/lib/plans";
import type { AssistedSale } from "@/lib/sales/assisted";
import { createAdminClient } from "@/lib/supabase/admin";

import { AdminSection } from "../ui";
import { SaleForm } from "./sale-form";
import { saleStatus } from "./sale-status";

const brl = (cents: number) => `${formatBRL(cents)}`;

/** WhatsApp sales (2026-11-06): the seller creates the account and sends the Pix. */
export default async function AdminSalesPage() {
  const { data } = await createAdminClient()
    .from("assisted_sales")
    .select("*, business:businesses(name)")
    .order("created_at", { ascending: false })
    .limit(100);
  const sales = (data ?? []) as (AssistedSale & { business: { name: string } | null })[];
  const niches = [
    ...NICHES.map((b) => ({ value: b.key, label: b.niche!.name })).sort((a, b) =>
      a.label.localeCompare(b.label, "pt-BR"),
    ),
    { value: "general", label: "Outro" },
  ];
  const prices = {
    site: {
      monthly: `${brl(PLAN_PRICES.site.monthly)}/mês`,
      yearly: `${brl(PLAN_PRICES.site.yearly)}/ano`,
    },
    complete: {
      monthly: `${brl(PLAN_PRICES.complete.monthly)}/mês`,
      yearly: `${brl(PLAN_PRICES.complete.yearly)}/ano`,
    },
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Vendas pelo WhatsApp</h1>
        <Button asChild variant="outline">
          <Link href="/admin/vendas/roteiro">Roteiro de mensagens</Link>
        </Button>
      </div>
      <AdminSection
        title="Nova venda"
        description="Com os dados que o cliente mandou no chat. Cria a conta (sem teste grátis) e o Pix da 1ª mensalidade."
      >
        <SaleForm niches={niches} prices={prices} />
      </AdminSection>
      <AdminSection title={`Vendas (${sales.length})`}>
        {sales.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma venda ainda.</p>
        ) : (
          <ul className="divide-y">
            {sales.map((sale) => (
              <li key={sale.id}>
                <Link
                  href={`/admin/vendas/${sale.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:bg-muted"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{sale.business?.name ?? "—"}</span>
                    <span className="block text-sm text-muted-foreground">
                      {sale.payer_name} ·{" "}
                      {formatInTimeZone(
                        new Date(sale.created_at),
                        "America/Sao_Paulo",
                        "dd/MM HH:mm",
                      )}
                    </span>
                  </span>
                  <span className="text-sm">
                    {TIER_NAME[sale.tier]} · {brl(sale.value_cents)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${sale.status === "paid" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    {saleStatus(sale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AdminSection>
    </>
  );
}
