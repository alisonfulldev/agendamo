/** Notification kinds the owner/staff can turn on or off per channel. */
export const OWNER_NOTIFICATION_TYPES = {
  booking_request: "Novo pedido de horário",
  appointment_new: "Novo agendamento",
  appointment_changed: "Cancelamentos e remarcações",
  deposit_informed: "Comprovantes de sinal para conferir",
  daily_alert: "Pessoas que quiseram agendar fora do horário",
  weekly_summary: "Resumo semanal",
  empty_slots: "Horários vagos amanhã",
  account: "Plano, teste e cobrança",
  profile_tips: "Dicas para completar o perfil",
  news: "Novidades e dicas",
} as const;

export type OwnerNotificationType = keyof typeof OWNER_NOTIFICATION_TYPES;

/** Kinds that carry a one-click opt-out link in the e-mail (rule 10). */
export const OPT_OUT_TYPES: ReadonlySet<OwnerNotificationType> = new Set(["news", "profile_tips"]);
