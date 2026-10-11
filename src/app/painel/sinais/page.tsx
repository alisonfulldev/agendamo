import { formatInTimeZone } from "date-fns-tz";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader, Section } from "@/components/panel/page-header";
import { requireOwner } from "@/lib/business/context";
import type { Appointment, DepositReceipt } from "@/lib/db/types";
import { formatAmount } from "@/lib/money";
import { getPlanFeatures } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

import { DepositDecision, RefundForm } from "./decisions";

export const metadata: Metadata = { title: "Sinais pelo Pix" };

type Row = Appointment & {
  customer: { name: string } | null;
  appointment_services: { name: string }[];
  deposit_receipts: Pick<
    DepositReceipt,
    "id" | "status" | "content_type" | "uploaded_at" | "object_key"
  >[];
};

const STATUS: Record<string, string> = {
  waiting: "Aguardando pagamento",
  sent: "Comprovante enviado",
  confirmed: "Confirmado",
  refused: "Recusado",
  expired: "Expirado",
  refunded: "Devolvido",
};

/**
 * Deposits by Pix: receipts to check (expected amount, with its unique cents, in evidence), the
 * ones waiting for payment, and the month's report. Decisions are always the professional's.
 */
export default async function DepositsPage() {
  const { business } = await requireOwner();
  const features = getPlanFeatures(business);
  const tz = business.timezone;
  const monthStart = new Date(`${formatInTimeZone(new Date(), tz, "yyyy-MM")}-01T00:00:00Z`);
  const { data } = await createAdminClient()
    .from("appointments")
    .select(
      "*, customer:customers(name), appointment_services(name), deposit_receipts(id, status, content_type, uploaded_at, object_key)",
    )
    .eq("business_id", business.id)
    .neq("deposit_status", "none")
    .order("starts_at", { ascending: true })
    .limit(500);
  const rows = (data ?? []) as Row[];
  if (!features.deposits && rows.length === 0) {
    notFound();
  }

  const toCheck = rows.filter((r) => r.deposit_status === "sent");
  const waiting = rows.filter((r) => r.deposit_status === "waiting");
  const thisMonth = (r: Row) =>
    r.deposit_decided_at && new Date(r.deposit_decided_at) >= monthStart;
  const decided = rows
    .filter((r) => ["confirmed", "refused", "expired", "refunded"].includes(r.deposit_status))
    .sort((a, b) => (b.deposit_decided_at ?? "").localeCompare(a.deposit_decided_at ?? ""))
    .slice(0, 30);
  const confirmedMonth = rows.filter(
    (r) => (r.deposit_status === "confirmed" || r.deposit_status === "refunded") && thisMonth(r),
  );
  const refusedMonth = rows.filter((r) => r.deposit_status === "refused" && thisMonth(r));
  const when = (iso: string) => formatInTimeZone(new Date(iso), tz, "dd/MM 'às' HH:mm");
  const services = (r: Row) => r.appointment_services.map((s) => s.name).join(" + ");
  const receiptOf = (r: Row) =>
    r.deposit_receipts.find((x) => x.status === "received" || x.status === "accepted");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sinais pelo Pix"
        description="O cliente paga direto na sua chave e envia o comprovante. Confira no seu banco pelo valor com centavos e confirme."
      />

      <dl className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border bg-card p-3">
          <dt className="text-xs text-muted-foreground">Confirmados no mês</dt>
          <dd className="text-xl font-bold">{confirmedMonth.length}</dd>
          <dd className="text-xs text-muted-foreground">
            R$ {formatAmount(confirmedMonth.reduce((sum, r) => sum + r.deposit_cents, 0))}
          </dd>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <dt className="text-xs text-muted-foreground">Para conferir</dt>
          <dd className="text-xl font-bold">{toCheck.length}</dd>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <dt className="text-xs text-muted-foreground">Recusados no mês</dt>
          <dd className="text-xl font-bold">{refusedMonth.length}</dd>
        </div>
      </dl>

      <Section title="Comprovantes para conferir">
        {toCheck.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum comprovante esperando você.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {toCheck.map((r) => {
              const receipt = receiptOf(r);
              const url = receipt?.object_key ? `/painel/sinais/comprovante/${receipt.id}` : null;
              return (
                <li
                  key={r.id}
                  className="grid gap-4 rounded-xl border p-4 sm:grid-cols-[1fr_220px]"
                >
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">Valor esperado</p>
                    <p className="font-heading text-3xl font-bold text-primary">
                      R$ {formatAmount(r.deposit_cents)}
                    </p>
                    <p className="font-medium">
                      {r.customer?.name} · {services(r)}
                    </p>
                    <p className="text-sm text-muted-foreground">Horário: {when(r.starts_at)}</p>
                    {r.deposit_sent_at ? (
                      <p className="text-sm text-muted-foreground">
                        Comprovante enviado em {when(r.deposit_sent_at)}
                      </p>
                    ) : null}
                    <DepositDecision appointmentId={r.id} />
                  </div>
                  {url ? (
                    receipt?.content_type === "application/pdf" ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener"
                        className="flex h-40 items-center justify-center rounded-lg border bg-muted text-sm font-medium text-primary"
                      >
                        Abrir comprovante (PDF)
                      </a>
                    ) : (
                      <a href={url} target="_blank" rel="noopener">
                        {/* eslint-disable-next-line @next/next/no-img-element -- private receipt served by the panel */}
                        <img
                          src={url}
                          alt="Comprovante enviado pelo cliente"
                          className="max-h-80 w-full rounded-lg border object-contain"
                        />
                      </a>
                    )
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {waiting.length ? (
        <Section
          title="Aguardando pagamento"
          description="O horário fica reservado até o fim do prazo."
        >
          <ul className="divide-y text-sm">
            {waiting.map((r) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>
                  {r.customer?.name} · {services(r)} · {when(r.starts_at)}
                </span>
                <span className="text-muted-foreground">
                  R$ {formatAmount(r.deposit_cents)}
                  {r.deposit_expires_at ? ` · reservado até ${when(r.deposit_expires_at)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Histórico">
        {decided.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não há sinais decididos.</p>
        ) : (
          <ul className="divide-y text-sm">
            {decided.map((r) => (
              <li key={r.id} className="flex flex-col gap-1 py-2">
                <span className="flex flex-wrap justify-between gap-2">
                  <span>
                    {r.customer?.name} · {services(r)} · {when(r.starts_at)}
                  </span>
                  <span className="font-medium">
                    R$ {formatAmount(r.deposit_cents)} · {STATUS[r.deposit_status]}
                  </span>
                </span>
                {r.deposit_status === "refused" && r.deposit_refused_reason ? (
                  <span className="text-muted-foreground">Motivo: {r.deposit_refused_reason}</span>
                ) : null}
                {r.deposit_status === "refunded" && r.deposit_refunded_cents ? (
                  <span className="text-muted-foreground">
                    Devolvido R$ {formatAmount(r.deposit_refunded_cents)} em{" "}
                    {r.deposit_refunded_at?.split("-").reverse().join("/")}
                  </span>
                ) : null}
                {r.deposit_status === "confirmed" || r.deposit_status === "refused" ? (
                  <RefundForm appointmentId={r.id} defaultAmount={formatAmount(r.deposit_cents)} />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
