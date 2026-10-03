import { NextResponse } from "next/server";

import { loadAppointmentDetails, manageUrl, serviceEnd, serviceNames } from "@/lib/booking/details";
import { buildIcs } from "@/lib/ics";
import { createAdminClient } from "@/lib/supabase/admin";

/** "Salvar na minha agenda" (iPhone / other calendars): calendar file for the appointment behind a cancel token. */
export async function GET(_request: Request, { params }: RouteContext<"/api/ics/[token]">) {
  const { token } = await params;
  if (!/^[0-9a-f]{32}$/.test(token)) return new NextResponse("Not found", { status: 404 });
  const { data } = await createAdminClient()
    .from("appointments")
    .select("id")
    .eq("cancel_token", token)
    .maybeSingle();
  const details = data ? await loadAppointmentDetails(data.id as string) : null;
  if (!details) return new NextResponse("Not found", { status: 404 });

  const ics = buildIcs({
    uid: `${details.appointment.id}@lively`,
    start: new Date(details.appointment.starts_at),
    end: serviceEnd(details),
    title: `${serviceNames(details)} · ${details.business.name}`,
    location: details.page?.address
      ? [details.page.address, details.page.neighborhood, details.page.city]
          .filter(Boolean)
          .join(", ")
      : undefined,
    description: `Remarcar ou cancelar: ${manageUrl(details)}`,
    status: details.appointment.status === "cancelled" ? "CANCELLED" : "CONFIRMED",
  });
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="agendamento.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
