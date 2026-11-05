import { formatInTimeZone } from "date-fns-tz";

import { audit } from "@/lib/audit";
import { processBillingExpirations } from "@/lib/billing/service";
import { invalidatePublicPage } from "@/lib/cache";
import { cronRoute } from "@/lib/cron";
import type { Business } from "@/lib/db/types";
import { claimNotification, notifyTeam } from "@/lib/notifications/owner";
import { getPlanFeatures, PLAN_NAME, PRICE_TEXT, TRIAL_DAYS } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

const DAY = 86_400_000;

/** What happens when the trial ends without a subscription (waiting mode). */
const WHAT_CHANGES = [
  "Seu link continua no ar: os clientes escolhem o serviço, o dia e o turno, e o pedido chega no seu WhatsApp para você confirmar.",
  "O painel fica pausado. Agenda, clientes e configurações ficam guardados, e os horários já marcados continuam valendo.",
  "Assinando, tudo volta na hora.",
];

const CTA = { label: `Assinar o ${PLAN_NAME}`, url: "/painel/plano" };

/**
 * 14-day trial notices (e-mail + push), each once: day 10, day 13 (ends tomorrow) and day 14 (last
 * day). When it ends without payment the account is in waiting mode (nothing changes in the
 * database, nothing is deleted); the public page cache is refreshed so the chat hands off to
 * WhatsApp. Also sends the one-time notice about the single plan (migration 2026-10-12) and runs
 * the billing job (cancelled periods, overdue, new prices). Idempotent.
 */
export const POST = cronRoute(async () => {
  const admin = createAdminClient();
  const now = Date.now();
  const result = { planNotice: 0, day10: 0, day13: 0, day14: 0, ended: 0 };

  // One-time notice to accounts moved to the 14-day trial by the single-plan migration.
  const { data: noticed } = await admin
    .from("businesses")
    .update({ plan_change_notice_pending: false })
    .eq("plan_change_notice_pending", true)
    .select("*");
  for (const business of (noticed ?? []) as Business[]) {
    if (!business.trial_ends_at) continue;
    const until = formatInTimeZone(new Date(business.trial_ends_at), business.timezone, "dd/MM");
    await notifyTeam({
      businessId: business.id,
      type: "account",
      subject: `Novidade: ${TRIAL_DAYS} dias do ${PLAN_NAME} para você`,
      content: {
        heading: `Agora o MeetChat tem um plano só: o ${PLAN_NAME}`,
        paragraphs: [
          `Agendamentos ilimitados, lembretes, chat no seu site, sinal pelo Pix e tudo mais por ${PRICE_TEXT.summary}.`,
          `Você ganhou ${TRIAL_DAYS} dias para usar tudo, até ${until}, sem cartão.`,
          "Se não assinar depois disso:",
          ...WHAT_CHANGES,
        ],
        cta: { label: "Abrir meu painel", url: "/painel" },
      },
      push: {
        title: `${TRIAL_DAYS} dias do ${PLAN_NAME} para você`,
        body: `Tudo liberado até ${until}, sem cartão.`,
        url: "/painel",
      },
    });
    result.planNotice++;
  }

  const { data, error } = await admin
    .from("businesses")
    .select("*")
    .eq("plan", "free")
    .not("trial_ends_at", "is", null)
    .gt("trial_ends_at", new Date(now - 7 * DAY).toISOString());
  if (error) throw new Error(error.message);

  for (const business of (data ?? []) as Business[]) {
    const ends = new Date(business.trial_ends_at!).getTime();
    const key = business.trial_ends_at!;

    if (ends <= now) {
      // Ended without a subscription: waiting mode (the last-day notice already explained it).
      if (!(await claimNotification(business.id, "trial_ended", key))) continue;
      invalidatePublicPage(business.slug);
      await audit({
        businessId: business.id,
        userId: null,
        action: "plan.trial_ended",
        details: { subscribed: getPlanFeatures(business).subscribed },
      });
      result.ended++;
    } else if (ends - now <= DAY) {
      if (!(await claimNotification(business.id, "trial_d14", key))) continue;
      await notifyTeam({
        businessId: business.id,
        type: "account",
        subject: "Hoje é o último dia do seu teste",
        content: {
          heading: "Hoje é o último dia do seu teste",
          paragraphs: [
            `Assine hoje para os clientes continuarem marcando sozinhos (${PRICE_TEXT.summary}).`,
            "Se não assinar:",
            ...WHAT_CHANGES,
          ],
          cta: CTA,
        },
        push: {
          title: "Último dia do teste",
          body: `Assine o ${PLAN_NAME} para os clientes continuarem marcando sozinhos.`,
          url: "/painel/plano",
        },
      });
      result.day14++;
    } else if (ends - now <= 2 * DAY) {
      if (!(await claimNotification(business.id, "trial_d13", key))) continue;
      await notifyTeam({
        businessId: business.id,
        type: "account",
        subject: "Seu teste termina amanhã",
        content: {
          heading: "Seu teste termina amanhã",
          paragraphs: [
            `Amanhã termina o seu teste do ${PLAN_NAME}. Assine quando quiser: libera na hora e o teste continua valendo até o fim (${PRICE_TEXT.summary}).`,
            "Se não assinar:",
            ...WHAT_CHANGES,
          ],
          cta: CTA,
        },
        push: {
          title: "Seu teste termina amanhã",
          body: `Assine o ${PLAN_NAME} para manter os agendamentos automáticos.`,
          url: "/painel/plano",
        },
      });
      result.day13++;
    } else if (ends - now <= 5 * DAY) {
      if (!(await claimNotification(business.id, "trial_d10", key))) continue;
      const until = formatInTimeZone(new Date(ends), business.timezone, "dd/MM");
      await notifyTeam({
        businessId: business.id,
        type: "account",
        subject: `Seu teste do ${PLAN_NAME} vai até ${until}`,
        content: {
          heading: `Seu teste vai até ${until}`,
          paragraphs: [
            `Faltam poucos dias do seu teste do ${PLAN_NAME}. Assine quando quiser: libera na hora e o teste continua valendo até o fim. ${PRICE_TEXT.summary}.`,
            "Se não assinar:",
            ...WHAT_CHANGES,
          ],
          cta: CTA,
        },
        push: {
          title: `Seu teste vai até ${until}`,
          body: `Assine o ${PLAN_NAME} para os clientes continuarem marcando sozinhos.`,
          url: "/painel/plano",
        },
      });
      result.day10++;
    }
  }
  const billing = await processBillingExpirations();
  return { ...result, billing };
});
