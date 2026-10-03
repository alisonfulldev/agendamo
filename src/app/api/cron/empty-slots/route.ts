import { addDaysToDate, todayIn } from "@/lib/availability";
import { loadCatalog } from "@/lib/booking/data";
import { freeTimesOn } from "@/lib/booking/free-times";
import { cronRoute } from "@/lib/cron";
import type { Business } from "@/lib/db/types";
import { claimNotification, notifyTeam } from "@/lib/notifications/owner";
import { getPlanFeatures } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

/** Afternoon: tell the owner when tomorrow still has many free slots (once per day). */
export const POST = cronRoute(async () => {
  const admin = createAdminClient();
  const { data: businesses } = await admin.from("businesses").select("*").is("suspended_at", null);
  let sent = 0;
  for (const business of (businesses ?? []) as Business[]) {
    if (!getPlanFeatures(business).agenda) continue;
    const tomorrow = addDaysToDate(todayIn(business.timezone, new Date()), 1);
    const { data: settings } = await admin
      .from("marketing_settings")
      .select("empty_slots_threshold")
      .eq("business_id", business.id)
      .maybeSingle();
    const threshold = (settings?.empty_slots_threshold as number | undefined) ?? 4;
    const catalog = await loadCatalog(business.id);
    if (!catalog) continue;
    const times = await freeTimesOn(catalog, tomorrow);
    if (times.length < threshold) continue;
    if (!(await claimNotification(business.id, "empty_slots", tomorrow))) continue;
    await notifyTeam({
      businessId: business.id,
      type: "empty_slots",
      subject: `Amanhã ainda tem ${times.length} horários livres`,
      content: {
        heading: "Horários livres amanhã",
        paragraphs: [
          `Amanhã ainda tem horários livres: ${times.slice(0, 8).join(", ")}${times.length > 8 ? "…" : ""}.`,
          "Que tal postar uma arte “Horários livres amanhã” nos stories? Ela já sai com os horários e o QR code da sua página.",
        ],
        cta: { label: "Criar arte", url: "/painel/vendas/artes?tipo=horarios-amanha" },
      },
      push: {
        title: "Horários livres amanhã",
        body: `${times.length} horários ainda livres. Crie uma arte para divulgar.`,
        url: "/painel/vendas/artes?tipo=horarios-amanha",
      },
    });
    sent++;
  }
  return { sent };
});
