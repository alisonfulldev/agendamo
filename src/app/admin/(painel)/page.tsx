import { formatInTimeZone } from "date-fns-tz";
import Link from "next/link";

import { getNiche } from "@/brands";
import {
  adminStatus,
  computeOverview,
  dailyCounts,
  daysAgoIso,
  monthlyRevenue,
  weekOf,
} from "@/lib/admin-metrics";
import type { Business, Subscription } from "@/lib/db/types";
import { formatBRL } from "@/lib/money";
import { createAdminClient } from "@/lib/supabase/admin";

import { AdminSection, BarChart, dayMonth, StatTile } from "./ui";

const TZ = "America/Sao_Paulo";
const pct = (n: number) => `${Math.round(n * 100)}%`;

/** Overview: revenue, base by situation, sign-ups, bookings and what needs attention. */
export default async function AdminOverviewPage() {
  const db = createAdminClient();
  const [businessesResult, subscriptionsResult, appointmentsResult, chatBookingsResult] =
    await Promise.all([
      db
        .from("businesses")
        .select(
          "id, name, slug, brand_key, plan, trial_started_at, trial_ends_at, suspended_at, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(5000),
      db.from("subscriptions").select("*"),
      db.from("appointments").select("created_at").gte("created_at", daysAgoIso(30)).limit(50000),
      db.from("appointments").select("business_id").eq("source", "chat").limit(50000),
    ]);
  const businesses = (businessesResult.data ?? []) as Business[];
  const subscriptions = (subscriptionsResult.data ?? []) as Subscription[];
  const now = new Date();
  const overview = computeOverview(businesses, subscriptions, now);
  const today = formatInTimeZone(now, TZ, "yyyy-MM-dd");

  // Bookings per day (30 days) and sign-ups per week (12 weeks).
  const bookingsPerDay = dailyCounts(
    (appointmentsResult.data ?? []).map((a) =>
      formatInTimeZone(new Date(a.created_at as string), TZ, "yyyy-MM-dd"),
    ),
    30,
    today,
  );
  const currentWeek = weekOf(now.toISOString());
  const signupsPerWeek = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(`${currentWeek}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 7 * (11 - i));
    const week = d.toISOString().slice(0, 10);
    return { key: week, value: businesses.filter((b) => weekOf(b.created_at) === week).length };
  });

  // Activation: businesses that already got a booking through the chat.
  const withChatBooking = new Set((chatBookingsResult.data ?? []).map((a) => a.business_id));
  const activation = businesses.length ? withChatBooking.size / businesses.length : 0;

  // Needs attention.
  const soon = now.getTime() + 3 * 86_400_000;
  const endingTrials = businesses.filter(
    (b) =>
      adminStatus(b, now) === "trial" &&
      b.trial_ends_at &&
      new Date(b.trial_ends_at).getTime() <= soon,
  );
  const overdue = subscriptions.filter((s) => s.status === "overdue");
  const idle = businesses.filter(
    (b) =>
      now.getTime() - new Date(b.created_at).getTime() >= 3 * 86_400_000 &&
      !withChatBooking.has(b.id) &&
      adminStatus(b, now) === "trial",
  );
  const nameOf = new Map(businesses.map((b) => [b.id, b.name]));

  // By niche.
  const niches = new Map<
    string,
    { name: string; total: number; subscribed: number; trial: number; mrr: number }
  >();
  for (const b of businesses) {
    const name = getNiche(b.brand_key).niche?.name ?? "Outro / Geral";
    const row = niches.get(name) ?? { name, total: 0, subscribed: 0, trial: 0, mrr: 0 };
    row.total++;
    const status = adminStatus(b, now);
    if (status === "subscribed") row.subscribed++;
    if (status === "trial") row.trial++;
    const sub = subscriptions.find((s) => s.business_id === b.id);
    if (sub) row.mrr += monthlyRevenue(sub);
    niches.set(name, row);
  }
  const nicheRows = [...niches.values()].sort((a, b) => b.total - a.total);

  return (
    <>
      <h1 className="text-2xl font-bold">Visão geral</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="MRR"
          value={formatBRL(overview.mrrCents)}
          note={`ARR ${formatBRL(overview.arrCents)}`}
        />
        <StatTile
          label="Assinantes"
          value={overview.byStatus.subscribed}
          note={`Ticket médio ${formatBRL(overview.arpaCents)}/mês`}
        />
        <StatTile
          label="Em teste"
          value={overview.byStatus.trial}
          note={`${overview.byStatus.waiting} em modo de espera`}
        />
        <StatTile
          label="Teste → assinante"
          value={
            overview.trialConversion.finished
              ? pct(overview.trialConversion.paid / overview.trialConversion.finished)
              : "—"
          }
          note={`${overview.trialConversion.paid} de ${overview.trialConversion.finished} testes encerrados`}
        />
        <StatTile
          label="Cadastros (7 dias)"
          value={overview.signups7}
          note={`${overview.signups30} em 30 dias`}
        />
        <StatTile
          label="Ativação"
          value={pct(activation)}
          note={`${withChatBooking.size} de ${businesses.length} já receberam agendamento pelo chat`}
        />
        <StatTile
          label="Cancelamentos (30 dias)"
          value={overview.churn30.cancelled}
          note={`Churn ${pct(overview.churn30.rate)}`}
        />
        <StatTile
          label="Suspensos"
          value={overview.byStatus.suspended}
          note={`${businesses.length} negócios no total`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminSection title="Cadastros por semana" description="Últimas 12 semanas">
          <BarChart data={signupsPerWeek} label="cadastros" formatKey={dayMonth} />
        </AdminSection>
        <AdminSection title="Agendamentos por dia" description="Últimos 30 dias, todos os negócios">
          <BarChart
            data={bookingsPerDay.map((d) => ({ key: d.day, value: d.count }))}
            label="agendamentos"
            formatKey={dayMonth}
          />
        </AdminSection>
      </div>

      <AdminSection title="Precisa de atenção">
        <div className="grid gap-4 md:grid-cols-3">
          <AttentionList
            title="Teste acabando (até 3 dias)"
            items={endingTrials.map((b) => ({
              id: b.id,
              text: b.name,
              note: b.trial_ends_at ? formatInTimeZone(new Date(b.trial_ends_at), TZ, "dd/MM") : "",
            }))}
          />
          <AttentionList
            title="Assinaturas em atraso"
            items={overdue.map((s) => ({
              id: s.business_id,
              text: nameOf.get(s.business_id) ?? "Negócio",
              note: s.current_period_end
                ? `venceu ${formatInTimeZone(new Date(s.current_period_end), TZ, "dd/MM")}`
                : "",
            }))}
          />
          <AttentionList
            title="Em teste sem nenhum agendamento"
            items={idle.map((b) => ({
              id: b.id,
              text: b.name,
              note: `desde ${formatInTimeZone(new Date(b.created_at), TZ, "dd/MM")}`,
            }))}
          />
        </div>
      </AdminSection>

      <AdminSection title="Por nicho">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 pr-3 font-medium">Nicho</th>
                <th className="py-2 pr-3 text-right font-medium">Negócios</th>
                <th className="py-2 pr-3 text-right font-medium">Em teste</th>
                <th className="py-2 pr-3 text-right font-medium">Assinantes</th>
                <th className="py-2 text-right font-medium">MRR</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {nicheRows.map((row) => (
                <tr key={row.name}>
                  <td className="py-2 pr-3">{row.name}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{row.total}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{row.trial}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{row.subscribed}</td>
                  <td className="py-2 text-right tabular-nums">{formatBRL(row.mrr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSection>
    </>
  );
}

function AttentionList({
  title,
  items,
}: {
  title: string;
  items: { id: string; text: string; note: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-medium">
        {title} <span className="text-muted-foreground">({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">Nada por aqui.</p>
      ) : (
        <ul className="mt-1 divide-y text-sm">
          {items.slice(0, 8).map((item) => (
            <li key={item.id} className="flex justify-between gap-2 py-1.5">
              <Link href={`/admin/negocios?id=${item.id}`} className="truncate hover:underline">
                {item.text}
              </Link>
              <span className="shrink-0 text-muted-foreground">{item.note}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
