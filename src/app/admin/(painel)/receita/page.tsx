import { formatInTimeZone } from "date-fns-tz";
import Link from "next/link";

import { monthlyRevenue } from "@/lib/admin-metrics";
import type { Subscription } from "@/lib/db/types";
import { formatBRL } from "@/lib/money";
import { createAdminClient } from "@/lib/supabase/admin";

import { AdminSection, StatTile } from "../ui";

const TZ = "America/Sao_Paulo";
const date = (iso: string | null | undefined) =>
  iso ? formatInTimeZone(new Date(iso), TZ, "dd/MM/yy") : "—";

const STATUS: Record<Subscription["status"], string> = {
  pending: "Aguardando 1º pagamento",
  active: "Ativa",
  overdue: "Em atraso",
  cancelled: "Cancelada",
};

/** Revenue: MRR split, every subscription with its status and the next charge. */
export default async function AdminRevenuePage() {
  const db = createAdminClient();
  const [subscriptionsResult, businessesResult] = await Promise.all([
    db.from("subscriptions").select("*").order("updated_at", { ascending: false }),
    db.from("businesses").select("id, name"),
  ]);
  const subscriptions = (subscriptionsResult.data ?? []) as Subscription[];
  const nameOf = new Map(
    (businessesResult.data ?? []).map((b) => [b.id as string, b.name as string]),
  );
  const paying = subscriptions.filter((s) => s.status === "active" || s.status === "overdue");
  const mrr = paying.reduce((sum, s) => sum + monthlyRevenue(s), 0);
  const monthlyMrr = paying
    .filter((s) => s.billing_cycle === "monthly")
    .reduce((sum, s) => sum + monthlyRevenue(s), 0);
  const overdue = paying.filter((s) => s.status === "overdue");
  const order: Subscription["status"][] = ["overdue", "active", "pending", "cancelled"];
  const sorted = [...subscriptions].sort(
    (a, b) => order.indexOf(a.status) - order.indexOf(b.status),
  );

  return (
    <>
      <h1 className="text-2xl font-bold">Receita</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="MRR" value={formatBRL(mrr)} note={`ARR ${formatBRL(mrr * 12)}`} />
        <StatTile
          label="Planos mensais"
          value={formatBRL(monthlyMrr)}
          note={`${paying.filter((s) => s.billing_cycle === "monthly").length} assinaturas`}
        />
        <StatTile
          label="Planos anuais (por mês)"
          value={formatBRL(mrr - monthlyMrr)}
          note={`${paying.filter((s) => s.billing_cycle === "yearly").length} assinaturas`}
        />
        <StatTile
          label="Em atraso"
          value={overdue.length}
          note={
            overdue.length
              ? formatBRL(overdue.reduce((s, x) => s + monthlyRevenue(x), 0))
              : "Nenhuma"
          }
        />
      </div>

      <AdminSection
        title="Assinaturas"
        description="Em atraso primeiro, depois ativas, aguardando e canceladas."
      >
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não há assinaturas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 pr-3 font-medium">Negócio</th>
                  <th className="py-2 pr-3 font-medium">Situação</th>
                  <th className="py-2 pr-3 font-medium">Ciclo</th>
                  <th className="py-2 pr-3 text-right font-medium">Profissionais</th>
                  <th className="py-2 pr-3 text-right font-medium">Por mês</th>
                  <th className="py-2 pr-3 font-medium">Pagamento</th>
                  <th className="py-2 font-medium">Próxima cobrança / fim</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sorted.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2 pr-3">
                      <Link
                        href={`/admin/negocios?id=${s.business_id}`}
                        className="font-medium hover:underline"
                      >
                        {nameOf.get(s.business_id) ?? "Negócio"}
                      </Link>
                    </td>
                    <td
                      className={`py-2 pr-3 ${s.status === "overdue" ? "font-medium text-destructive" : ""}`}
                    >
                      {STATUS[s.status]}
                    </td>
                    <td className="py-2 pr-3">
                      {s.billing_cycle === "yearly" ? "Anual" : "Mensal"}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {(s.extra_professionals ?? 0) + 1}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {s.status === "active" || s.status === "overdue"
                        ? formatBRL(monthlyRevenue(s))
                        : "—"}
                    </td>
                    <td className="py-2 pr-3">
                      {s.billing_type === "credit_card" ? "Cartão" : "Pix"}
                    </td>
                    <td className="py-2 tabular-nums">{date(s.current_period_end)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSection>
    </>
  );
}
