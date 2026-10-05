import type { AppointmentStatus } from "@/lib/db/types";

/** Appointment as shown in the agenda (times pre-computed in the business timezone). */
export interface AgendaAppointment {
  id: string;
  professionalId: string;
  status: AppointmentStatus;
  source: "chat" | "manual";
  startsAt: string;
  endsAt: string;
  /** Local date "YYYY-MM-DD" and minutes from local midnight. */
  date: string;
  startMinute: number;
  endMinute: number;
  timeLabel: string;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  services: string;
  priceCents: number;
  depositCents: number;
  depositStatus: string;
  depositExpiresAt: string | null;
}

export interface AgendaBlock {
  id: string;
  professionalId: string;
  date: string;
  startMinute: number;
  endMinute: number;
  label: string;
  reason: string | null;
}

export interface AgendaCatalog {
  professionals: { id: string; name: string }[];
  services: { id: string; name: string; durationMinutes: number; priceCents: number }[];
  combos: { id: string; name: string; priceCents: number }[];
}

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: "Confirmado",
  pending: "Aguardando aprovação",
  awaiting_deposit: "Aguardando sinal",
  cancelled: "Cancelado",
  completed: "Concluído",
  no_show: "Faltou",
};

/** Panel notice after a reschedule: the e-mail only goes when the customer left one. */
export function rescheduledText(emailed: boolean): string {
  return emailed
    ? "Remarcado. O cliente recebeu o novo horário por e-mail."
    : "Remarcado. O cliente não deixou e-mail: avise pelo WhatsApp.";
}
