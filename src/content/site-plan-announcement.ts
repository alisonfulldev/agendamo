import { PLAN_NAME, PRICE_TEXT, SITE_PLAN_NAME, SITE_PRICE_TEXT } from "@/lib/plans";

/**
 * One-time announcement of "Site + Agenda" (2026-11-06) to accounts created before it: a panel
 * popup and an e-mail in "Novidades e dicas" (with one-click opt-out). Text per situation.
 */

export const ANNOUNCEMENT_CUTOFF = "2026-11-05T00:00:00Z";
export const ANNOUNCEMENT_KEY = "announce_site_plan";

export type AnnouncementGroup = "trial" | "complete" | "waiting";

export const ANNOUNCEMENT_GROUP_LABEL: Record<AnnouncementGroup, string> = {
  trial: "Em teste",
  complete: `Assinantes do ${PLAN_NAME}`,
  waiting: "Teste vencido (modo de espera)",
};

export function announcementEmail(group: AnnouncementGroup, siteUrl: string) {
  switch (group) {
    case "trial":
      return {
        subject: "Novidade: seu teste agora vem com um site 🎉",
        heading: "Seu negócio ganhou um site",
        paragraphs: [
          `Agora o MeetChat também faz o site do seu negócio, pronto para aparecer no Google. O seu já está no ar: ${siteUrl}`,
          "Ele mostra seus serviços, preços, fotos e avaliações, e todo botão “Agendar” abre o seu chat. Você muda cores, foto e textos em Meu site.",
          `No fim do teste, você escolhe: ${SITE_PLAN_NAME} por ${SITE_PRICE_TEXT.monthly}, ou só a agenda (${PLAN_NAME}) por ${PRICE_TEXT.monthly}.`,
        ],
        cta: { label: "Ver meu site", url: "/painel/site" },
        push: "Seu teste agora inclui um site pronto para o Google.",
      };
    case "complete":
      return {
        subject: "Novidade: agora o MeetChat também faz o seu site",
        heading: "Tenha também o seu site",
        paragraphs: [
          "Agora o MeetChat também faz o site do seu negócio, pronto para aparecer no Google, com seus serviços, preços, fotos e avaliações. Todo botão “Agendar” abre o seu chat.",
          `É o plano ${SITE_PLAN_NAME}: ${SITE_PRICE_TEXT.monthly} (hoje você paga ${PRICE_TEXT.monthly}). Ao mudar, o site entra no ar na hora e o valor novo vale a partir da próxima cobrança.`,
        ],
        cta: { label: `Conhecer o ${SITE_PLAN_NAME}`, url: "/painel/plano#assinar" },
        push: `Novo: ${SITE_PLAN_NAME}, com o seu site pronto para o Google.`,
      };
    case "waiting":
      return {
        subject: "Novidade: site + agenda para o seu negócio",
        heading: "Tem novidade no MeetChat",
        paragraphs: [
          "Agora o MeetChat também faz o site do seu negócio, pronto para aparecer no Google, com seus serviços, preços, fotos e avaliações.",
          `Assinando o ${SITE_PLAN_NAME} (${SITE_PRICE_TEXT.monthly}), sua agenda volta na hora, com tudo que estava guardado, e o seu site entra no ar. Se preferir só a agenda, o ${PLAN_NAME} sai por ${PRICE_TEXT.monthly}.`,
        ],
        cta: { label: "Escolher meu plano", url: "/painel/plano" },
        push: "Novo: site + agenda para o seu negócio.",
      };
  }
}

/** Panel popup (accounts in the panel: trial and "Completo" subscribers). */
export const ANNOUNCEMENT_POPUP = {
  trial: {
    title: "Novidade: seu teste agora vem com um site 🎉",
    text: "Seu negócio ganhou um site completo, pronto para o Google, com seus serviços, fotos e avaliações. Todo botão “Agendar” abre o seu chat.",
    cta: { label: "Ver meu site", href: "/painel/site" },
  },
  complete: {
    title: "Novidade: tenha também o seu site",
    text: `Com o ${SITE_PLAN_NAME}, seu negócio ganha um site pronto para o Google, com o agendamento dentro. ${SITE_PRICE_TEXT.monthly}; o site entra no ar na hora.`,
    cta: { label: `Conhecer o ${SITE_PLAN_NAME}`, href: "/painel/plano#assinar" },
  },
} as const;
