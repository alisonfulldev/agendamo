import type { Metadata } from "next";

import { PageHeader } from "@/components/panel/page-header";
import { addDaysToDate } from "@/lib/availability";
import { requireOwner } from "@/lib/business/context";
import { getPlanFeatures } from "@/lib/plans";
import { displayCount, sumWeek, weekStart, type DailyStats, type WeekTotals } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Estatísticas" };

const METRICS: { key: keyof WeekTotals; label: string; hint?: string }[] = [
  { key: "views", label: "Visitas no seu link" },
  { key: "conversations", label: "Conversas iniciadas", hint: "Pessoas que responderam o chat." },
  { key: "requests", label: "Pedidos de horário" },
  { key: "bookings", label: "Agendamentos" },
  {
    key: "outsideHours",
    label: "Quiseram agendar fora do horário",
    hint: "Conversas iniciadas com você fechada.",
  },
  { key: "links", label: "Cliques nos links do perfil", hint: "Instagram e seus links." },
];

function Delta({ current, previous }: { current: number; previous: number }) {
  if (current < 5 && previous < 5) return null;
  const diff = current - previous;
  if (diff === 0)
    return <span className="text-xs text-muted-foreground">igual à semana passada</span>;
  return (
    <span className={`text-xs ${diff > 0 ? "text-primary" : "text-muted-foreground"}`}>
      {diff > 0 ? "▲" : "▼"} {displayCount(Math.abs(diff))} vs. semana passada
    </span>
  );
}

export default async function StatsPage() {
  const { business } = await requireOwner();
  const features = getPlanFeatures(business);
  const thisWeek = weekStart(new Date(), business.timezone);
  const lastWeek = addDaysToDate(thisWeek, -7);

  const supabase = await createClient();
  const { data } = await supabase
    .from("page_stats_daily")
    .select("date, counts, outside_hours")
    .eq("business_id", business.id)
    .gte("date", lastWeek);
  const rows = (data ?? []) as DailyStats[];
  const current = sumWeek(rows, thisWeek);
  const previous = sumWeek(rows, lastWeek);

  return (
    <div>
      <PageHeader
        title="Estatísticas"
        description="Semana atual (desde segunda) comparada com a anterior. Números são atualizados de hora em hora."
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {METRICS.filter((m) => m.key !== "bookings" || features.agenda).map((metric) => (
          <li key={metric.key} className="flex flex-col gap-1 rounded-xl border bg-card p-4">
            <span className="text-sm text-muted-foreground">{metric.label}</span>
            <span className="font-heading text-3xl font-bold">
              {displayCount(current[metric.key])}
            </span>
            <span className="text-xs text-muted-foreground">
              Semana passada: {displayCount(previous[metric.key])}
            </span>
            <Delta current={current[metric.key]} previous={previous[metric.key]} />
            {metric.hint ? (
              <span className="text-xs text-muted-foreground">{metric.hint}</span>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        Por privacidade, números abaixo de 5 aparecem como “menos de 5”. Suas próprias visitas não
        são contadas.
      </p>
    </div>
  );
}
