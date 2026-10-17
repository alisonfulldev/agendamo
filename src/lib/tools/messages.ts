/**
 * WhatsApp message generator (/ferramentas/mensagens-whatsapp): confirmation, reminder and
 * rescheduling texts in the niche's vocabulary (horário/sessão), to copy and send by hand.
 * Pure, so the page renders the first version on the server.
 */
export const MESSAGE_KINDS = ["confirmacao", "lembrete", "reagendamento"] as const;
export type MessageKind = (typeof MESSAGE_KINDS)[number];

export const MESSAGE_KIND_LABELS: Record<MessageKind, string> = {
  confirmacao: "Confirmação",
  lembrete: "Lembrete",
  reagendamento: "Reagendamento",
};

export interface MessageVocabulary {
  /** "horário", "sessão"… (masculine or feminine noun). */
  appointment: string;
  /** "o" or "a": article of the appointment word. */
  article: "o" | "a";
  /** Formal tone (health niches). */
  formal: boolean;
}

export interface MessageFields {
  customer: string;
  service: string;
  date: string;
  time: string;
  business: string;
  /** Booking link (optional): the customer can reschedule on their own. */
  link: string;
}

const or = (value: string, fallback: string) => value.trim() || fallback;

export function buildMessage(
  kind: MessageKind,
  vocabulary: MessageVocabulary,
  fields: MessageFields,
): string {
  const customer = or(fields.customer, "[nome]");
  const service = or(fields.service, "[serviço]");
  const date = or(fields.date, "[dia]");
  const time = or(fields.time, "[hora]");
  const business = or(fields.business, "[seu negócio]");
  const link = fields.link.trim();
  const hi = vocabulary.formal ? `Olá, ${customer}!` : `Oi, ${customer}! 😊`;
  const your = vocabulary.article === "a" ? "sua" : "seu";
  const confirmed = vocabulary.article === "a" ? "confirmada" : "confirmado";
  const appointment = vocabulary.appointment;
  const rescheduleLine = link
    ? `Se precisar remarcar, escolha outro horário por aqui: ${link}`
    : "Se precisar remarcar, me avise por aqui com antecedência.";

  switch (kind) {
    case "confirmacao":
      return [
        hi,
        `${capitalize(your)} ${appointment} de ${service} está ${confirmed} para ${date}, às ${time}, com ${business}.`,
        rescheduleLine,
        vocabulary.formal ? "Até lá!" : "Te espero! 💛",
      ].join("\n\n");
    case "lembrete":
      return [
        hi,
        `Passando para lembrar d${vocabulary.article} ${your} ${appointment} de ${service}: ${date}, às ${time}.`,
        `Você confirma presença? ${rescheduleLine}`,
      ].join("\n\n");
    case "reagendamento":
      return [
        hi,
        `Precisamos remarcar ${vocabulary.article} ${your} ${appointment} de ${service} de ${date}, às ${time}. Desculpe o transtorno.`,
        link
          ? `Escolha o novo horário que for melhor para você por aqui: ${link}`
          : "Quais dias e horários ficam bons para você?",
      ].join("\n\n");
  }
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
