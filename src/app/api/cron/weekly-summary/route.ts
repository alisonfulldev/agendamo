import { addDaysToDate } from "@/lib/availability";
import { cronRoute } from "@/lib/cron";
import type { Business } from "@/lib/db/types";
import { claimNotification, notifyTeam } from "@/lib/notifications/owner";
import { getPlanFeatures, PLAN_NAME } from "@/lib/plans";
import { getDemandBlock } from "@/lib/portal/demand";
import { displayCount, sumWeek, weekStart, type DailyStats } from "@/lib/stats";
import { createAdminClient } from "@/lib/supabase/admin";

/** Monday morning: last week's numbers to every business. Once per business per week. */
export const POST = cronRoute(async () => {
  const admin = createAdminClient();
  const now = new Date();
  await admin.rpc("refresh_page_stats", {
    p_since: addDaysToDate(now.toISOString().slice(0, 10), -8),
  });

  const { data: businesses, error } = await admin
    .from("businesses")
    .select("*")
    .is("suspended_at", null);
  if (error) throw new Error(error.message);

  let sent = 0;
  for (const business of (businesses ?? []) as Business[]) {
    const lastWeek = addDaysToDate(weekStart(now, business.timezone), -7);
    if (!(await claimNotification(business.id, "weekly_summary", lastWeek))) continue;

    const { data: rows } = await admin
      .from("page_stats_daily")
      .select("date, counts, outside_hours")
      .eq("business_id", business.id)
      .gte("date", lastWeek)
      .lt("date", addDaysToDate(lastWeek, 7));
    const week = sumWeek((rows ?? []) as DailyStats[], lastWeek);
    const features = getPlanFeatures(business, now);

    const paragraphs: string[] = [];
    const details = [
      { label: "Visitas no seu link", value: displayCount(week.views) },
      { label: "Conversas iniciadas no chat", value: displayCount(week.conversations) },
      { label: "Quiseram agendar fora do horário", value: displayCount(week.outsideHours) },
    ];

    {
      const { count } = await admin
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id)
        .eq("source", "chat")
        .gte("created_at", new Date(`${lastWeek}T00:00:00Z`).toISOString())
        .lt("created_at", new Date(`${addDaysToDate(lastWeek, 7)}T00:00:00Z`).toISOString());
      details.push({
        label: "Agendamentos feitos sozinhos pelo chat",
        value: displayCount(count ?? 0),
      });
      paragraphs.push(
        (count ?? 0) > 0
          ? "Seu chat de agendamento trabalhou por você, inclusive fora do horário."
          : "Divulgue seu link de agendamento no WhatsApp, Instagram, Facebook e no seu site para receber mais pedidos.",
      );
    }

    const demand = await getDemandBlock(business).catch(() => null);
    if (demand) paragraphs.push(demand);

    await notifyTeam({
      businessId: business.id,
      type: "weekly_summary",
      subject: `Sua semana: ${displayCount(week.views)} visitas no seu link`,
      content: {
        heading: "Resumo da semana",
        paragraphs,
        details,
        cta: !features.active
          ? { label: `Assinar o ${PLAN_NAME}`, url: "/painel/plano" }
          : { label: "Ver estatísticas", url: "/painel/estatisticas" },
        footnote:
          "Números abaixo de 5 aparecem como “menos de 5”, para proteger a privacidade de quem visita.",
      },
      push: {
        title: "Seu resumo da semana chegou",
        body: `${displayCount(week.views)} visitas no seu link`,
        url: "/painel/estatisticas",
      },
    });
    sent++;
  }
  return { sent };
});
