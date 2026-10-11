import { formatInTimeZone } from "date-fns-tz";

import { addDaysToDate } from "@/lib/availability";
import { cronRoute } from "@/lib/cron";
import type { Business } from "@/lib/db/types";
import { claimNotification, notifyTeam } from "@/lib/notifications/owner";
import { getPlanFeatures, PLAN_NAME } from "@/lib/plans";
import { displayCount } from "@/lib/stats";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Morning alert when people clicked the main button outside working hours yesterday.
 * At most one per business per day (notification_log). Wording: "pessoas quiseram agendar".
 */
export const POST = cronRoute(async () => {
  const admin = createAdminClient();
  const now = new Date();
  const utcToday = now.toISOString().slice(0, 10);
  await admin.rpc("refresh_page_stats", { p_since: addDaysToDate(utcToday, -2) });

  const { data: rows, error } = await admin
    .from("page_stats_daily")
    .select("business_id, date, outside_hours, business:businesses(*)")
    .gte("date", addDaysToDate(utcToday, -2));
  if (error) throw new Error(error.message);

  let sent = 0;
  for (const row of rows ?? []) {
    const business = row.business as unknown as Business | null;
    if (!business || business.suspended_at) continue;
    const yesterday = addDaysToDate(formatInTimeZone(now, business.timezone, "yyyy-MM-dd"), -1);
    if (row.date !== yesterday) continue;
    const clicks = Number((row.outside_hours as Record<string, number>).click_book ?? 0);
    if (clicks === 0) continue;
    if (!(await claimNotification(business.id, "daily_alert", yesterday))) continue;

    const features = getPlanFeatures(business, now);
    const people = clicks < 5 ? "Algumas pessoas" : `${displayCount(clicks)} pessoas`;
    await notifyTeam({
      businessId: business.id,
      type: "daily_alert",
      subject: `${people} quiseram agendar ontem fora do seu horário`,
      content: {
        heading: "Quiseram agendar fora do horário",
        paragraphs: [
          `${people} clicaram para agendar ontem enquanto você estava fora do horário de atendimento.`,
          !features.active
            ? `Com o ${PLAN_NAME}, elas escolhem um horário livre sozinhas, mesmo com você fechada.`
            : "Com o chat de agendamento, elas puderam escolher um horário livre sozinhas.",
        ],
        cta: features.active
          ? { label: "Ver agenda", url: "/painel/agenda" }
          : { label: "Assinar", url: "/painel/plano" },
      },
      push: {
        title: "Quiseram agendar fora do horário",
        body: `${people} clicaram em agendar ontem.`,
        url: "/painel/estatisticas",
      },
    });
    sent++;
  }
  return { sent };
});
