import { computeDepositMetrics, daysAgoIso } from "@/lib/admin-metrics";
import { createAdminClient } from "@/lib/supabase/admin";

import { AdminSection, StatTile } from "../ui";

const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "—");

/**
 * Product usage (last 30 days, every business): the booking funnel of the chats, where bookings
 * come from, deposits by Pix and the A/B test of the home. Anonymous counts only.
 */
export default async function AdminUsagePage() {
  const db = createAdminClient();
  const since = daysAgoIso(30);
  const countEvents = async (type: string) => {
    const { count } = await db
      .from("page_events")
      .select("id", { count: "exact", head: true })
      .eq("type", type)
      .gte("occurred_at", since);
    return count ?? 0;
  };
  const countBookings = async (source: string) => {
    const { count } = await db
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("source", source)
      .gte("created_at", since);
    return count ?? 0;
  };
  const [
    views,
    started,
    confirmed,
    handoffs,
    chatBookings,
    panelBookings,
    depositRows,
    duplicates,
    signups,
  ] = await Promise.all([
    countEvents("view"),
    countEvents("booking_started"),
    countEvents("booking_confirmed"),
    countEvents("handoff_sent"),
    countBookings("chat"),
    countBookings("panel"),
    db
      .from("appointments")
      .select("deposit_status, deposit_sent_at, deposit_decided_at")
      .neq("deposit_status", "none")
      .gte("created_at", since)
      .limit(50000),
    db
      .from("deposit_receipts")
      .select("id", { count: "exact", head: true })
      .eq("status", "duplicate"),
    db.from("audit_log").select("details").eq("action", "business.created").limit(50000),
  ]);
  const deposits = computeDepositMetrics(
    (depositRows.data ?? []) as Parameters<typeof computeDepositMetrics>[0],
    duplicates.count ?? 0,
  );
  const variants = { a: 0, b: 0 };
  for (const row of signups.data ?? []) {
    const variant = (row.details as { source?: { variant?: string } } | null)?.source?.variant;
    if (variant === "a" || variant === "b") variants[variant]++;
  }
  const funnel = [
    { label: "Visitas aos chats", value: views },
    { label: "Começaram a agendar", value: started },
    { label: "Agendamentos confirmados no chat", value: confirmed },
  ];

  return (
    <>
      <h1 className="text-2xl font-bold">Uso do produto</h1>
      <p className="-mt-4 text-sm text-muted-foreground">Últimos 30 dias, todos os negócios.</p>

      <AdminSection
        title="Funil dos chats de agendamento"
        description="Visitas de clientes aos links dos negócios (donas logadas e robôs não contam)."
      >
        <ol className="flex flex-col gap-3">
          {funnel.map((step, i) => {
            const width = funnel[0]!.value ? Math.max(2, (step.value / funnel[0]!.value) * 100) : 0;
            return (
              <li key={step.label} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span>{step.label}</span>
                  <span className="tabular-nums">
                    <span className="font-semibold">{step.value}</span>
                    {i > 0 ? (
                      <span className="text-muted-foreground">
                        {" "}
                        · {pct(step.value, funnel[i - 1]!.value)} da etapa anterior
                      </span>
                    ) : null}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${width}%` }} />
                </div>
              </li>
            );
          })}
        </ol>
      </AdminSection>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Agendamentos pelo chat" value={chatBookings} />
        <StatTile label="Lançados pela dona" value={panelBookings} />
        <StatTile
          label="Pedidos que foram para o WhatsApp"
          value={handoffs}
          note="Contas em modo de espera"
        />
        <StatTile
          label="Cadastros: versão A / B da home"
          value={`${variants.a} / ${variants.b}`}
          note="Teste A/B do topo (?v=b)"
        />
      </div>

      <AdminSection title="Sinais pelo Pix">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Agendamentos com sinal" value={deposits.withDeposit} />
          <StatTile
            label="Avisaram que pagaram"
            value={`${Math.round(deposits.receiptRate * 100)}%`}
            note="“Já fiz o Pix” ou comprovante"
          />
          <StatTile
            label="Tempo até a dona conferir"
            value={
              deposits.avgMinutesToDecision === null ? "—" : `${deposits.avgMinutesToDecision} min`
            }
          />
          <StatTile
            label="Confirmados / recusados / expirados"
            value={`${deposits.confirmed} / ${deposits.refused} / ${deposits.expired}`}
          />
        </div>
      </AdminSection>
    </>
  );
}
