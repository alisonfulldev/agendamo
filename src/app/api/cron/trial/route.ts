import { audit } from "@/lib/audit";
import { processBillingExpirations } from "@/lib/billing/service";
import { invalidatePublicPage } from "@/lib/cache";
import { cronRoute } from "@/lib/cron";
import type { Business } from "@/lib/db/types";
import { claimNotification, notifyTeam } from "@/lib/notifications/owner";
import { FREE_BOOKINGS_PER_CYCLE, getPlanFeatures, PLAN_NAMES, PRICE_TEXT } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

const DAY = 86_400_000;

/** What changes when the trial ends without a subscription (Grátis plan). */
const WHAT_CHANGES = [
  `Sua conta passa para o Grátis: ${FREE_BOOKINGS_PER_CYCLE} agendamentos automáticos por mês. Depois disso, o chat passa os pedidos para o seu WhatsApp até o mês renovar.`,
  "Sem lembretes para os clientes, sem chat no seu site e com a marca do MeetChat no rodapé.",
  "Clientes, financeiro, vendas, equipe e estatísticas ficam bloqueados. Nada é apagado: tudo volta na hora em que você assinar.",
];

/**
 * 7-day trial notices: day 5, day 6 and the end (e-mail + push), each once. When it ends without
 * payment the account is simply on Grátis (nothing to change in the database, nothing deleted).
 * Also runs the billing job (cancelled periods, overdue, scheduled downgrades, new prices).
 */
export const POST = cronRoute(async () => {
  const admin = createAdminClient();
  const now = Date.now();
  const { data, error } = await admin
    .from("businesses")
    .select("*")
    .eq("plan", "free")
    .not("trial_ends_at", "is", null)
    .gt("trial_ends_at", new Date(now - 7 * DAY).toISOString());
  if (error) throw new Error(error.message);

  const result = { day5: 0, day6: 0, ended: 0 };
  for (const business of (data ?? []) as Business[]) {
    const ends = new Date(business.trial_ends_at!).getTime();
    const key = business.trial_ends_at!;
    const plan = business.trial_plan ?? "pro";
    const name = PLAN_NAMES[plan];
    const price = PRICE_TEXT[plan].summary;

    if (ends <= now) {
      if (!(await claimNotification(business.id, "trial_ended", key))) continue;
      invalidatePublicPage(business.slug);
      await audit({
        businessId: business.id,
        userId: null,
        action: "plan.trial_ended",
        details: { plan, subscribed: getPlanFeatures(business).subscribed },
      });
      await notifyTeam({
        businessId: business.id,
        type: "account",
        subject: `Seu teste do ${name} terminou`,
        content: {
          heading: `Seu teste do ${name} terminou`,
          paragraphs: [...WHAT_CHANGES, `Para voltar ao ${name}: ${price}.`],
          cta: { label: `Assinar o ${name}`, url: "/painel/plano" },
        },
        push: {
          title: `Seu teste do ${name} terminou`,
          body: `Sua conta está no Grátis (${FREE_BOOKINGS_PER_CYCLE} agendamentos por mês). Assine para liberar tudo.`,
          url: "/painel/plano",
        },
      });
      result.ended++;
    } else if (ends - now <= 2 * DAY) {
      // Day 6 of 7: the trial ends tomorrow.
      if (!(await claimNotification(business.id, "trial_d6", key))) continue;
      await notifyTeam({
        businessId: business.id,
        type: "account",
        subject: `Seu teste do ${name} termina amanhã`,
        content: {
          heading: "Seu teste termina amanhã",
          paragraphs: [
            `Amanhã termina o seu teste do ${name}. Assine hoje para não perder nada (${price}).`,
            ...WHAT_CHANGES,
          ],
          cta: { label: `Assinar o ${name}`, url: "/painel/plano" },
        },
        push: {
          title: "Seu teste termina amanhã",
          body: `Assine o ${name} para manter agendamentos ilimitados.`,
          url: "/painel/plano",
        },
      });
      result.day6++;
    } else if (ends - now <= 3 * DAY) {
      // Day 5 of 7.
      if (!(await claimNotification(business.id, "trial_d5", key))) continue;
      await notifyTeam({
        businessId: business.id,
        type: "account",
        subject: `Faltam 2 dias do seu teste do ${name}`,
        content: {
          heading: "Faltam 2 dias do seu teste",
          paragraphs: [
            `Seu teste do ${name} termina em 2 dias. Assine quando quiser: libera na hora e o teste continua valendo até o fim. ${price}.`,
            "Se não assinar:",
            ...WHAT_CHANGES,
          ],
          cta: { label: "Ver planos", url: "/painel/plano" },
        },
        push: {
          title: "Faltam 2 dias do teste",
          body: `Assine o ${name} para não perder os agendamentos ilimitados.`,
          url: "/painel/plano",
        },
      });
      result.day5++;
    }
  }
  const billing = await processBillingExpirations();
  return { ...result, billing };
});
