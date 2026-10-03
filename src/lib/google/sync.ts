import "server-only";

import { serviceEnd, serviceNames, loadAppointmentDetails } from "@/lib/booking/details";
import { getPlanFeatures } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

import { calendarFetch, getConnection } from "./client";

const ACTIVE = new Set(["confirmed", "pending", "awaiting_deposit"]);

/** Pushes create/update/cancel of an appointment to the professional's Google Calendar (Prompt 34). */
export async function syncAppointmentToGoogle(appointmentId: string): Promise<void> {
  const details = await loadAppointmentDetails(appointmentId);
  if (!details || !getPlanFeatures(details.business).googleCalendar) return;
  const connection = await getConnection(details.professional.id);
  if (!connection) return;
  const { appointment } = details;
  const admin = createAdminClient();
  const calendar = encodeURIComponent(connection.calendar_id);

  if (!ACTIVE.has(appointment.status)) {
    if (appointment.google_event_id) {
      await calendarFetch(
        connection,
        `/calendars/${calendar}/events/${encodeURIComponent(appointment.google_event_id)}`,
        { method: "DELETE" },
      );
      await admin.from("appointments").update({ google_event_id: null }).eq("id", appointment.id);
    }
    return;
  }

  const event = {
    summary: `${serviceNames(details)} · ${details.customer.name}`,
    description: `Agendado pelo ${details.brand.name}${appointment.status !== "confirmed" ? " (aguardando confirmação)" : ""}.`,
    start: { dateTime: appointment.starts_at, timeZone: details.business.timezone },
    end: { dateTime: serviceEnd(details).toISOString(), timeZone: details.business.timezone },
    // Our own events must not block our own slots twice: mark them transparent.
    transparency: "transparent",
  };

  if (appointment.google_event_id) {
    const response = await calendarFetch(
      connection,
      `/calendars/${calendar}/events/${encodeURIComponent(appointment.google_event_id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(event),
      },
    );
    if (response.ok || response.status !== 404) return;
  }
  const created = await calendarFetch(connection, `/calendars/${calendar}/events`, {
    method: "POST",
    body: JSON.stringify(event),
  });
  if (created.ok) {
    const { id } = (await created.json()) as { id: string };
    await admin.from("appointments").update({ google_event_id: id }).eq("id", appointment.id);
  }
}
