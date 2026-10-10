"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDays, getSlots, loadCatalog, resolveSelection } from "@/lib/booking/data";
import { formatDateLong, loadAppointmentDetails, serviceNames } from "@/lib/booking/details";
import { cancelAppointment, rescheduleAppointment } from "@/lib/booking/manage";
import type { Appointment } from "@/lib/db/types";
import { notifyTeam } from "@/lib/notifications/owner";
import { rateLimitRequest } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const tokenSchema = z.string().regex(/^[0-9a-f]{32}$/);

async function byToken(token: unknown) {
  const parsed = tokenSchema.safeParse(token);
  if (!parsed.success) return null;
  const { data } = await createAdminClient()
    .from("appointments")
    .select("*, business:businesses(min_notice_minutes, timezone, id)")
    .eq("cancel_token", parsed.data)
    .maybeSingle();
  return data as
    | (Appointment & { business: { min_notice_minutes: number; timezone: string; id: string } })
    | null;
}

/** Changes are allowed only while the appointment is active and outside the minimum notice. */
export async function canChange(
  appointment: Pick<Appointment, "status" | "starts_at">,
  minNoticeMinutes: number,
): Promise<boolean> {
  const active = ["confirmed", "pending", "awaiting_deposit"].includes(appointment.status);
  return (
    active && new Date(appointment.starts_at).getTime() - Date.now() >= minNoticeMinutes * 60_000
  );
}

export async function cancelByTokenAction(
  token: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!(await rateLimitRequest("publicAction", "cancel")))
    return { ok: false, message: "Muitas tentativas." };
  const appointment = await byToken(token);
  if (!appointment) return { ok: false, message: "Agendamento não encontrado." };
  if (!(await canChange(appointment, appointment.business.min_notice_minutes))) {
    return { ok: false, message: "Não dá mais para cancelar por aqui. Fale direto com o negócio." };
  }
  const done = await cancelAppointment(appointment.id, "customer");
  revalidatePath(`/cancelar/${token}`);
  return done ? { ok: true } : { ok: false, message: "Não foi possível cancelar." };
}

async function selectionFor(appointment: Appointment) {
  const catalog = await loadCatalog(appointment.business_id);
  if (!catalog) return null;
  const { data: lines } = await createAdminClient()
    .from("appointment_services")
    .select("service_id, position")
    .eq("appointment_id", appointment.id)
    .order("position");
  const resolved = resolveSelection(catalog, {
    serviceIds: (lines ?? []).map((l) => l.service_id as string),
  });
  return resolved ? { catalog, services: resolved.services } : null;
}

export async function rescheduleDaysAction(
  token: string,
  from: string | null,
): Promise<{ date: string; label: string }[]> {
  if (!(await rateLimitRequest("slots"))) return [];
  const appointment = await byToken(token);
  if (!appointment || !(await canChange(appointment, appointment.business.min_notice_minutes)))
    return [];
  const ctx = await selectionFor(appointment);
  if (!ctx) return [];
  const days = await getDays(
    {
      catalog: ctx.catalog,
      services: ctx.services,
      professional: appointment.professional_id,
      excludeAppointmentId: appointment.id,
    },
    from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : null,
    14,
  );
  return days.map((d) => ({ date: d.date, label: formatDateLong(`${d.date}T15:00:00Z`, "UTC") }));
}

export async function rescheduleSlotsAction(
  token: string,
  date: string,
): Promise<{ startsAt: string; time: string }[]> {
  if (!(await rateLimitRequest("slots")) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  const appointment = await byToken(token);
  if (!appointment || !(await canChange(appointment, appointment.business.min_notice_minutes)))
    return [];
  const ctx = await selectionFor(appointment);
  if (!ctx) return [];
  const slots = await getSlots(
    {
      catalog: ctx.catalog,
      services: ctx.services,
      professional: appointment.professional_id,
      excludeAppointmentId: appointment.id,
    },
    date,
  );
  return slots.map((s) => ({ startsAt: s.startsAt, time: s.time }));
}

export async function rescheduleByTokenAction(
  token: string,
  startsAt: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!(await rateLimitRequest("publicAction", "reschedule")))
    return { ok: false, message: "Muitas tentativas." };
  const appointment = await byToken(token);
  if (!appointment || !(await canChange(appointment, appointment.business.min_notice_minutes))) {
    return { ok: false, message: "Não dá mais para remarcar por aqui. Fale direto com o negócio." };
  }
  const parsed = z.iso.datetime({ offset: true }).safeParse(startsAt);
  if (!parsed.success) return { ok: false, message: "Horário inválido." };
  const result = await rescheduleAppointment(appointment.id, parsed.data, "customer");
  revalidatePath(`/cancelar/${token}`);
  if (result.ok) return { ok: true };
  return {
    ok: false,
    message:
      result.error === "conflict"
        ? "Esse horário acabou de ser ocupado. Escolha outro."
        : "Não foi possível remarcar.",
  };
}

export async function informDepositAction(token: string): Promise<{ ok: boolean }> {
  if (!(await rateLimitRequest("publicAction", "deposit"))) return { ok: false };
  const appointment = await byToken(token);
  if (
    !appointment ||
    appointment.status !== "awaiting_deposit" ||
    appointment.deposit_status !== "waiting"
  )
    return { ok: false };
  const { data } = await createAdminClient()
    .from("appointments")
    .update({ deposit_status: "informed" })
    .eq("id", appointment.id)
    .eq("deposit_status", "waiting")
    .select("id");
  if (!data?.length) return { ok: false };

  const details = await loadAppointmentDetails(appointment.id);
  if (details) {
    await notifyTeam({
      businessId: details.business.id,
      type: "deposit_informed",
      professionalId: details.professional.id,
      subject: `${details.customer.name} informou que pagou o sinal`,
      content: {
        heading: "Confira o pagamento do sinal",
        paragraphs: [
          `${details.customer.name} disse que pagou o sinal de ${serviceNames(details)} em ${formatDateLong(details.appointment.starts_at, details.business.timezone)}.`,
          "Confira no seu banco e confirme no painel para garantir o horário.",
        ],
        cta: { label: "Confirmar sinal", url: "/painel/agenda" },
      },
      push: {
        title: "Sinal informado",
        body: `${details.customer.name} disse que pagou. Confira e confirme.`,
        url: "/painel/agenda",
      },
    });
  }
  revalidatePath(`/cancelar/${token}`);
  return { ok: true };
}
