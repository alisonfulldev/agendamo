import { TIER_NAME, type Tier } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

import { AdminSection } from "../ui";
import { SunsetButton } from "./sunset-button";

interface Row {
  business_id: string;
  status: string;
  tier: Tier | null;
  current_period_end: string | null;
  sunset_at: string | null;
  business: { name: string; slug: string } | { name: string; slug: string }[] | null;
}

const date = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—";

/**
 * Subscriptions from before the Premium (2026-11-27): Completo and Site + Agenda that still renew.
 * "Encerrar no vencimento" stops the renewal (the plan runs until the paid period ends), tells the
 * owner, and the notices 7, 3 and 1 day before go by themselves. Test accounts can be left alone.
 */
export default async function AdminLegacySubscriptionsPage() {
  const { data } = await createAdminClient()
    .from("subscriptions")
    .select(
      "business_id, status, tier, current_period_end, sunset_at, business:businesses(name, slug)",
    )
    .in("tier", ["complete", "site"])
    .in("status", ["active", "overdue", "cancelled"])
    .order("current_period_end", { ascending: true });
  const rows = (data ?? []) as Row[];
  const open = rows.filter((r) => r.status !== "cancelled");
  const sunset = rows.filter((r) => r.status === "cancelled" && r.sunset_at);
  const nameOf = (r: Row) => (Array.isArray(r.business) ? r.business[0] : r.business)?.name ?? "—";

  return (
    <>
      <h1 className="text-2xl font-bold">Assinaturas antigas</h1>
      <AdminSection
        title={`Renovam no plano antigo (${open.length})`}
        description="Ao encerrar, a assinatura vale até o vencimento e não renova. A dona recebe o aviso agora e de novo 7, 3 e 1 dia antes, e escolhe o plano novo no painel."
      >
        {open.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma assinatura antiga renovando.</p>
        ) : (
          <ul className="divide-y text-sm">
            {open.map((r) => (
              <li
                key={r.business_id}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <span>
                  {nameOf(r)} · {TIER_NAME[r.tier ?? "complete"]} · vence{" "}
                  {date(r.current_period_end)}
                </span>
                <SunsetButton businessId={r.business_id} />
              </li>
            ))}
          </ul>
        )}
      </AdminSection>
      <AdminSection title={`Encerradas no vencimento (${sunset.length})`}>
        {sunset.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma ainda.</p>
        ) : (
          <ul className="divide-y text-sm">
            {sunset.map((r) => (
              <li key={r.business_id} className="py-2">
                {nameOf(r)} · {TIER_NAME[r.tier ?? "complete"]} · vale até{" "}
                {date(r.current_period_end)}
              </li>
            ))}
          </ul>
        )}
      </AdminSection>
    </>
  );
}
