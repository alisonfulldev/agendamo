import "server-only";

import { formatInTimeZone } from "date-fns-tz";

import { layoutBlock } from "@/lib/availability";
import type { Appointment, AppointmentStatus, CancelledBy } from "@/lib/db/types";
import { createAdminClient } from "@/lib/supabase/admin";

import { getSlots, loadCatalog, stepsFor } from "./data";
import { onAppointmentCancelled, onAppointmentCompleted, onAppointmentRescheduled } from "./hooks";
import { notifyBookingCancelled, notifyBookingConfirmed, notifyBookingRescheduled } from "./notify";

const ACTIVE: AppointmentStatus[] = ["confirmed", "pending", "awaiting_deposit"];

async function load(appointmentId: string): Promise<Appointment | null> {
  const { data } = await createAdminClient()
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .maybeSingle();
  return (data as Appointment | null) ?? null;
}

/** Updates status only when the current status is one of `from` (avoids double transitions). */
async function transition(
  appointmentId: string,
  from: AppointmentStatus[],
  patch: Partial<Appointment>,
): Promise<boolean> {
  const { data } = await createAdminClient()
    .from("appointments")
    .update(patch)
    .eq("id", appointmentId)
    .in("status", from)
    .select("id");
  return (data?.length ?? 0) > 0;
}

export async function cancelAppointment(
  appointmentId: string,
  by: CancelledBy,
  reason?: string,
): Promise<boolean> {
  const changed = await transition(appointmentId, ACTIVE, {
    status: "cancelled",
    cancelled_at: new Date().toISOString(),
    cancelled_by: by,
    cancel_reason: reason?.trim().slice(0, 500) || null,
  });
  if (!changed) return false;
  // Cancelling frees the slot immediately (exclusion constraints only cover active statuses).
  await notifyBookingCancelled(appointmentId, by, reason);
  await onAppointmentCancelled(appointmentId);
  return true;
}

/**
 * Approves a pending appointment. When the customer said "Já fiz o Pix", approving means the owner
 * accepted the Pix: the deposit is confirmed too (otherwise it stayed "to check" and kept sending
 * reminders).
 */
export async function approveAppointment(appointmentId: string): Promise<boolean> {
  const appointment = await load(appointmentId);
  if (appointment?.status === "pending" && appointment.deposit_status === "sent") {
    if (!(await confirmDeposit(appointmentId))) return false;
    await createAdminClient()
      .from("deposit_receipts")
      .update({ status: "accepted", decided_at: new Date().toISOString() })
      .eq("appointment_id", appointmentId)
      .eq("status", "received");
    return true;
  }
  const changed = await transition(appointmentId, ["pending"], { status: "confirmed" });
  if (changed) await notifyBookingConfirmed(appointmentId);
  return changed;
}

/**
 * The professional confirms the deposit (after checking the bank): never automatic. Works while
 * waiting for the receipt or with the receipt sent (pre-confirmed).
 */
export async function confirmDeposit(appointmentId: string): Promise<boolean> {
  const admin = createAdminClient();
  const decidedAt = new Date().toISOString();
  const { data } = await admin
    .from("appointments")
    .update({ status: "confirmed", deposit_status: "confirmed", deposit_decided_at: decidedAt })
    .eq("id", appointmentId)
    .in("status", ["awaiting_deposit", "pending"])
    .in("deposit_status", ["waiting", "sent"])
    .select("id");
  if ((data?.length ?? 0) > 0) {
    await notifyBookingConfirmed(appointmentId);
    return true;
  }
  // The appointment was already approved (or cancelled, attended…) before the Pix was checked:
  // only the deposit is recorded as received, without touching the appointment or telling anyone.
  const { data: depositOnly } = await admin
    .from("appointments")
    .update({ deposit_status: "confirmed", deposit_decided_at: decidedAt })
    .eq("id", appointmentId)
    .in("status", ["confirmed", "cancelled", "completed", "no_show"])
    .eq("deposit_status", "sent")
    .select("id");
  return (depositOnly?.length ?? 0) > 0;
}

export async function completeAppointment(appointmentId: string): Promise<boolean> {
  const appointment = await load(appointmentId);
  if (!appointment || new Date(appointment.starts_at) > new Date()) return false;
  const changed = await transition(appointmentId, ["confirmed", "no_show"], {
    status: "completed",
  });
  if (changed) await onAppointmentCompleted(appointmentId);
  return changed;
}

export async function markNoShow(appointmentId: string): Promise<boolean> {
  const appointment = await load(appointmentId);
  if (!appointment || new Date(appointment.starts_at) > new Date()) return false;
  const changed = await transition(appointmentId, ["confirmed", "completed"], {
    status: "no_show",
  });
  if (changed) {
    const admin = createAdminClient();
    const { data: customer } = await admin
      .from("customers")
      .select("no_show_count")
      .eq("id", appointment.customer_id)
      .single();
    await admin
      .from("customers")
      .update({ no_show_count: ((customer?.no_show_count as number) ?? 0) + 1 })
      .eq("id", appointment.customer_id);
  }
  return changed;
}

export type RescheduleResult = { ok: true } | { ok: false; error: "conflict" | "invalid" };

/**
 * Moves an appointment to another free start (and optionally another professional), keeping its
 * services. The new start must be offered by the engine, ignoring the appointment's own time.
 */
export async function rescheduleAppointment(
  appointmentId: string,
  newStartsAt: string,
  by: "customer" | "business",
  newProfessionalId?: string,
): Promise<RescheduleResult> {
  const appointment = await load(appointmentId);
  if (!appointment || !ACTIVE.includes(appointment.status)) return { ok: false, error: "invalid" };
  const catalog = await loadCatalog(appointment.business_id);
  if (!catalog) return { ok: false, error: "invalid" };

  const admin = createAdminClient();
  const { data: lines } = await admin
    .from("appointment_services")
    .select("service_id, position")
    .eq("appointment_id", appointmentId)
    .order("position");
  const services = (lines ?? []).map((l) => catalog.services.find((s) => s.id === l.service_id));
  if (services.length === 0 || services.some((s) => !s)) return { ok: false, error: "invalid" };

  const professionalId = newProfessionalId ?? appointment.professional_id;
  const date = formatInTimeZone(new Date(newStartsAt), catalog.business.timezone, "yyyy-MM-dd");
  const slots = await getSlots(
    {
      catalog,
      services: services as never,
      professional: professionalId,
      excludeAppointmentId: appointmentId,
    },
    date,
  );
  const start = new Date(newStartsAt).toISOString();
  if (!slots.some((s) => s.startsAt === start)) return { ok: false, error: "conflict" };

  const block = layoutBlock(new Date(start), stepsFor(catalog, professionalId, services as never));
  const { error } = await admin.rpc("reschedule_appointment", {
    p_appointment_id: appointmentId,
    p_professional_id: professionalId,
    p_starts_at: block.start.toISOString(),
    p_ends_at: block.end.toISOString(),
    p_resources: block.steps.flatMap((step) =>
      step.resourceIds.map((resourceId) => ({
        resource_id: resourceId,
        starts_at: step.start.toISOString(),
        ends_at: step.end.toISOString(),
      })),
    ),
  });
  if (error) {
    if (error.code === "23P01") return { ok: false, error: "conflict" };
    throw new Error(`reschedule failed: ${error.message}`);
  }
  await notifyBookingRescheduled(appointmentId, by, appointment.starts_at);
  await onAppointmentRescheduled(appointmentId, appointment.starts_at);
  return { ok: true };
}
