import type { AdminStatus } from "@/lib/admin-metrics";

/**
 * Personal WhatsApp messages from the MeetChat developer to each account (2026-11-06, Admin ›
 * Negócios › "Chamar no WhatsApp"): one per situation, short and in first person. Opened by hand
 * as a wa.me link from the developer's own WhatsApp; nothing is sent automatically.
 */

export type OutreachSituation =
  "welcome" | "no_booking" | "no_photo" | "trial_ending" | "waiting" | "overdue" | "subscribed";

export const OUTREACH_LABELS: Record<OutreachSituation, string> = {
  welcome: "Boas-vindas",
  no_booking: "Sem agendamento",
  no_photo: "Sem foto",
  trial_ending: "Teste acabando",
  waiting: "Teste terminou",
  overdue: "Pagamento em atraso",
  subscribed: "Assinante",
};

const DAY_MS = 24 * 60 * 60 * 1000;

export interface OutreachInput {
  status: AdminStatus;
  createdAt: string;
  trialEndsAt: string | null;
  hasBooking: boolean;
  hasPhoto: boolean;
  /** Subscription with a late payment. */
  overdue?: boolean;
}

/** The most useful message for the account right now (null for suspended accounts). */
export function outreachSituation(
  input: OutreachInput,
  now = new Date(),
): OutreachSituation | null {
  if (input.status === "suspended") return null;
  if (input.status === "subscribed") return input.overdue ? "overdue" : "subscribed";
  if (input.status === "waiting") return "waiting";
  const ends = input.trialEndsAt ? new Date(input.trialEndsAt).getTime() - now.getTime() : null;
  if (ends !== null && ends <= 3 * DAY_MS) return "trial_ending";
  if (now.getTime() - new Date(input.createdAt).getTime() < 2 * DAY_MS) return "welcome";
  if (!input.hasBooking) return "no_booking";
  if (!input.hasPhoto) return "no_photo";
  return "welcome";
}

function daysLeftText(trialEndsAt: string | null, now: Date): string {
  if (!trialEndsAt) return "está terminando";
  const days = Math.ceil((new Date(trialEndsAt).getTime() - now.getTime()) / DAY_MS);
  if (days <= 1) return "termina amanhã";
  return `termina em ${days} dias`;
}

const HELLO = "Oi! Tudo bem? Aqui é o desenvolvedor do MeetChat 😊";

export function outreachMessage(
  situation: OutreachSituation,
  input: { businessName: string; link: string; trialEndsAt: string | null },
  now = new Date(),
): string {
  const { businessName, link } = input;
  switch (situation) {
    case "welcome":
      return `${HELLO} Vi que você criou a agenda do ${businessName} e queria te dar as boas-vindas. Se quiser, te ajudo a deixar tudo pronto: serviços, horários e o link no Instagram e no WhatsApp. Ficou alguma dúvida?`;
    case "no_booking":
      return `${HELLO} Vi que o link do ${businessName} ainda não recebeu agendamento e queria te ajudar com isso. Quer que eu te mostre onde colocar o link para os clientes começarem a marcar? Seu link: ${link}`;
    case "no_photo":
      return `${HELLO} Vi que o perfil do ${businessName} ainda está sem foto. Com foto, o cliente confia mais na hora de marcar. Quer ajuda para colocar? É no painel, em Minha página › Meu perfil.`;
    case "trial_ending":
      return `${HELLO} Seu teste ${daysLeftText(input.trialEndsAt, now)}. Queria saber como está sendo com o ${businessName}: tem alguma coisa que eu possa melhorar ou te ajudar a configurar?`;
    case "waiting":
      return `${HELLO} Vi que o teste do ${businessName} terminou. Queria entender o que faltou para o MeetChat funcionar para você. Sua opinião me ajuda muito a melhorar!`;
    case "overdue":
      return `${HELLO} Vi que a mensalidade do ${businessName} ficou pendente. Aconteceu alguma coisa com o Pix? Se quiser, te ajudo a resolver para a sua agenda não parar.`;
    case "subscribed":
      return `${HELLO} Obrigado por confiar no MeetChat com o ${businessName}! Qualquer dúvida ou ideia, pode me chamar aqui.`;
  }
}
