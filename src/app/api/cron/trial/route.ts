import { audit } from "@/lib/audit";
import { processBillingExpirations } from "@/lib/billing/service";
import { cronRoute } from "@/lib/cron";
import type { Business } from "@/lib/db/types";
import { claimNotification, notifyTeam } from "@/lib/notifications/owner";
import { invalidatePublicPage } from "@/lib/cache";
import { createAdminClient } from "@/lib/supabase/admin";

const DAY = 86_400_000;

/** Trial reminders (7 days and 1 day before) and end-of-trial notice. Idempotent. */
export const POST = cronRoute(async () => {
  const admin = createAdminClient();
  const now = Date.now();
  const { data, error } = await admin
    .from("businesses")
    .select("*")
    .eq("plan", "free")
    .not("trial_ends_at", "is", null)
    .gt("trial_ends_at", new Date(now - 30 * DAY).toISOString());
  if (error) throw new Error(error.message);

  const result = { reminded7: 0, reminded1: 0, ended: 0 };
  for (const business of (data ?? []) as Business[]) {
    const ends = new Date(business.trial_ends_at!).getTime();
    const key = business.trial_ends_at!;

    if (ends <= now) {
      if (!(await claimNotification(business.id, "trial_ended", key))) continue;
      invalidatePublicPage(business.slug);
      await audit({ businessId: business.id, userId: null, action: "plan.trial_ended" });
      await notifyTeam({
        businessId: business.id,
        type: "account",
        subject: "Seu teste grátis terminou",
        content: {
          heading: "Seu teste grátis terminou",
          paragraphs: [
            "Seu link continua no ar, mas agora os pedidos chegam só pelo seu WhatsApp: nada entra na agenda e nenhum horário fica reservado.",
            "Seus clientes, agendamentos e fotos estão guardados e voltam na hora em que você assinar.",
            "Assine por R$ 29/mês, ou R$ 240/ano (sai R$ 20/mês).",
          ],
          cta: { label: "Assinar agora", url: "/painel/plano" },
        },
        push: {
          title: "Seu teste grátis terminou",
          body: "Assine para voltar a receber agendamentos automáticos.",
          url: "/painel/plano",
        },
      });
      result.ended++;
    } else if (ends - now <= DAY) {
      if (!(await claimNotification(business.id, "trial_1d", key))) continue;
      await notifyTeam({
        businessId: business.id,
        type: "account",
        subject: "Seu teste grátis termina amanhã",
        content: {
          heading: "Seu teste termina amanhã",
          paragraphs: [
            "Para continuar recebendo agendamentos automáticos pelo chat, assine. Sem assinatura, os pedidos passam a chegar só pelo seu WhatsApp.",
          ],
          cta: { label: "Assinar agora", url: "/painel/plano" },
        },
        push: {
          title: "Seu teste termina amanhã",
          body: "Assine para manter o chat de agendamento.",
          url: "/painel/plano",
        },
      });
      result.reminded1++;
    } else if (ends - now <= 7 * DAY) {
      if (!(await claimNotification(business.id, "trial_7d", key))) continue;
      await notifyTeam({
        businessId: business.id,
        type: "account",
        subject: "Faltam 7 dias do seu teste grátis",
        content: {
          heading: "Faltam 7 dias do seu teste",
          paragraphs: [
            "Seu teste grátis termina em 7 dias. Assine quando quiser para não perder o chat e a agenda. No plano anual, sai R$ 20/mês.",
          ],
          cta: { label: "Assinar", url: "/painel/plano" },
        },
        push: {
          title: "Faltam 7 dias do teste",
          body: "Assine para continuar com o chat e a agenda.",
          url: "/painel/plano",
        },
      });
      result.reminded7++;
    }
  }
  // Subscriptions cancelled after the paid period, or overdue for 5+ days, are paused.
  const downgraded = await processBillingExpirations();
  return { ...result, downgraded };
});
