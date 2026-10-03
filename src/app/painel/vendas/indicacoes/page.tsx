import { formatInTimeZone } from "date-fns-tz";
import type { Metadata } from "next";

import { ActionButton } from "@/components/panel/action-button";
import { PageHeader, Section } from "@/components/panel/page-header";
import { Badge } from "@/components/ui/badge";
import { requireOwner } from "@/lib/business/context";
import type { Referral } from "@/lib/db/types";
import { loadMarketingSettings } from "@/lib/sales/load";
import { createClient } from "@/lib/supabase/server";

import { setRewardAppliedAction } from "../actions";
import { MarketingSettingsForm } from "../forms";

export const metadata: Metadata = { title: "Indicações" };

export default async function ReferralsPage() {
  const { business, brand } = await requireOwner();
  const supabase = await createClient();
  const [{ data }, settings] = await Promise.all([
    supabase
      .from("referrals")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
    loadMarketingSettings(business.id, brand),
  ]);
  const referrals = (data ?? []) as Referral[];
  const ids = [
    ...new Set(referrals.flatMap((r) => [r.referrer_customer_id, r.referred_customer_id])),
  ];
  const { data: customers } = ids.length
    ? await supabase.from("customers").select("id, name").in("id", ids)
    : { data: [] };
  const name = new Map((customers ?? []).map((c) => [c.id as string, c.name as string]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Indicações"
        description="Depois de cada atendimento a cliente recebe um link próprio para indicar. A indicação vale quando a indicada conclui o primeiro atendimento."
      />
      <Section title="Recompensa">
        <MarketingSettingsForm settings={settings} section="referral" />
      </Section>
      <Section title="Indicações recebidas">
        {referrals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma indicação ainda.</p>
        ) : (
          <ul className="divide-y text-sm">
            {referrals.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span>
                  <span className="font-medium">{name.get(r.referrer_customer_id)}</span> indicou{" "}
                  {name.get(r.referred_customer_id)}{" "}
                  {r.status === "valid" ? (
                    <Badge>Válida</Badge>
                  ) : (
                    <Badge variant="secondary">Aguardando 1º atendimento</Badge>
                  )}
                  <span className="block text-muted-foreground">
                    {formatInTimeZone(new Date(r.created_at), business.timezone, "dd/MM/yyyy")}
                  </span>
                </span>
                {r.status === "valid" ? (
                  <ActionButton
                    size="sm"
                    variant={r.reward_applied ? "ghost" : "default"}
                    action={setRewardAppliedAction.bind(null, r.id, !r.reward_applied)}
                  >
                    {r.reward_applied ? "Recompensa aplicada ✓" : "Marcar recompensa aplicada"}
                  </ActionButton>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
