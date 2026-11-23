import { formatInTimeZone } from "date-fns-tz";

import { ActionButton } from "@/components/panel/action-button";
import { requireAdmin } from "@/lib/admin";
import { formatBrPhone } from "@/lib/phone";
import { formatAmount } from "@/lib/money";
import { MIN_PAYOUT_CENTS, balanceOf } from "@/lib/partners/rules";
import { partnerPixKey, type Partner } from "@/lib/partners/service";
import { createAdminClient } from "@/lib/supabase/admin";

import { AdminSection } from "../ui";
import { payPartnerAction, setPartnerStatusAction } from "./actions";

const brl = (cents: number) => `R$ ${formatAmount(cents)}`;

/** Partner program: who is selling, what each one earned and the Pix to send. */
export default async function AdminPartnersPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const [{ data: partnerRows }, { data: commissionRows }, { data: businessRows }] =
    await Promise.all([
      admin.from("partners").select("*").order("created_at", { ascending: false }),
      admin.from("partner_commissions").select("partner_id, status, available_at, amount_cents"),
      admin.from("businesses").select("partner_id, plan").not("partner_id", "is", null),
    ]);
  const partners = (partnerRows ?? []) as Partner[];
  const commissions = (commissionRows ?? []) as {
    partner_id: string;
    status: string;
    available_at: string;
    amount_cents: number;
  }[];
  const businesses = (businessRows ?? []) as { partner_id: string; plan: string }[];

  const rows = partners.map((p) => {
    const own = businesses.filter((b) => b.partner_id === p.id);
    return {
      partner: p,
      clients: own.length,
      paying: own.filter((b) => b.plan === "complete").length,
      balance: balanceOf(commissions.filter((c) => c.partner_id === p.id)),
    };
  });
  const toPay = rows.filter((r) => r.balance.availableCents >= MIN_PAYOUT_CENTS);

  return (
    <>
      <h1 className="text-2xl font-bold">Parceiros</h1>
      <AdminSection
        title={`Para pagar (${toPay.length})`}
        description={`Comissões liberadas a partir de ${brl(MIN_PAYOUT_CENTS)}. Envie o Pix e depois marque como pago.`}
      >
        {toPay.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pagamento pendente.</p>
        ) : (
          <ul className="divide-y text-sm">
            {toPay.map(({ partner, balance }) => (
              <li
                key={partner.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <span>
                  <span className="font-medium">{partner.name}</span> ·{" "}
                  <span className="font-mono">{partnerPixKey(partner)}</span> ·{" "}
                  <span className="font-semibold">{brl(balance.availableCents)}</span>
                </span>
                <ActionButton
                  size="sm"
                  confirmText={`Confirma que enviou ${brl(balance.availableCents)} por Pix para ${partner.name}?`}
                  action={payPartnerAction.bind(null, partner.id)}
                >
                  Marcar como pago
                </ActionButton>
              </li>
            ))}
          </ul>
        )}
      </AdminSection>

      <AdminSection title={`Todos os parceiros (${partners.length})`}>
        {partners.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum parceiro ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 pr-3 font-medium">Parceiro</th>
                  <th className="py-2 pr-3 font-medium">Link</th>
                  <th className="py-2 pr-3 text-right font-medium">Clientes</th>
                  <th className="py-2 pr-3 text-right font-medium">A liberar</th>
                  <th className="py-2 pr-3 text-right font-medium">Liberado</th>
                  <th className="py-2 pr-3 text-right font-medium">Pago</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map(({ partner, clients, paying, balance }) => (
                  <tr
                    key={partner.id}
                    className={partner.status === "blocked" ? "text-muted-foreground" : ""}
                  >
                    <td className="py-2 pr-3">
                      <div className="font-medium">{partner.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {partner.email} · {formatBrPhone(partner.phone)} · desde{" "}
                        {formatInTimeZone(
                          new Date(partner.created_at),
                          "America/Sao_Paulo",
                          "dd/MM/yyyy",
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-3 font-mono">{partner.code}</td>
                    <td className="py-2 pr-3 text-right">
                      {clients} ({paying} pagando)
                    </td>
                    <td className="py-2 pr-3 text-right">{brl(balance.waitingCents)}</td>
                    <td className="py-2 pr-3 text-right">{brl(balance.availableCents)}</td>
                    <td className="py-2 pr-3 text-right">{brl(balance.paidCents)}</td>
                    <td className="py-2 text-right">
                      <ActionButton
                        size="sm"
                        variant="ghost"
                        confirmText={
                          partner.status === "blocked"
                            ? "Reativar este parceiro?"
                            : "Suspender este parceiro? Ele para de ganhar comissões."
                        }
                        action={setPartnerStatusAction.bind(
                          null,
                          partner.id,
                          partner.status === "blocked" ? "active" : "blocked",
                        )}
                      >
                        {partner.status === "blocked" ? "Reativar" : "Suspender"}
                      </ActionButton>
                    </td>
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
