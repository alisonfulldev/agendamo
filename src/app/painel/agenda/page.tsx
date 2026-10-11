import { formatInTimeZone } from "date-fns-tz";
import type { Metadata } from "next";

import { PageHeader } from "@/components/panel/page-header";
import { UpgradeNotice } from "@/components/panel/upgrade-notice";
import { addDaysToDate, localToUtc, todayIn } from "@/lib/availability";
import { requireBusiness } from "@/lib/business/context";
import type { Professional, WorkingHours } from "@/lib/db/types";
import { getPlanFeatures } from "@/lib/plans";
import { weekStart } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

import { AgendaView } from "./agenda-view";
import type { AgendaAppointment, AgendaBlock, AgendaCatalog } from "./types";

export const metadata: Metadata = { title: "Agenda" };

function minutesOf(iso: string, timezone: string): number {
  const [h, m] = formatInTimeZone(new Date(iso), timezone, "HH:mm").split(":").map(Number);
  return h! * 60 + m!;
}

export default async function AgendaPage({ searchParams }: PageProps<"/painel/agenda">) {
  const context = await requireBusiness();
  const { business } = context;
  const features = getPlanFeatures(business);
  if (!features.agenda) {
    return (
      <div>
        <PageHeader title="Agenda" />
        <UpgradeNotice
          features={features}
          title="Sua agenda, organizada sozinha"
          description="Com o Completo, as clientes escolhem um horário livre pelo chat e tudo aparece aqui."
          bullets={[
            "Visão de dia e semana",
            "Agendamento manual com horários livres calculados",
            "Lembretes automáticos 24h antes",
            "Cancelar, remarcar e marcar faltas",
          ]}
        />
      </div>
    );
  }

  const params = await searchParams;
  const view = params.view === "week" ? "week" : "day";
  const today = todayIn(business.timezone, new Date());
  const date =
    typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : today;
  const from =
    view === "week"
      ? weekStart(localToUtc(date, "12:00", business.timezone), business.timezone)
      : date;
  const to = addDaysToDate(from, view === "week" ? 7 : 1);

  const supabase = await createClient();
  const [pros, appointments, blocks, hours, services, combos] = await Promise.all([
    supabase
      .from("professionals")
      .select("*")
      .eq("business_id", business.id)
      .eq("active", true)
      .order("position"),
    supabase
      .from("appointments")
      .select(
        "*, customer:customers(id, name, phone), appointment_services(name, price_cents, position)",
      )
      .eq("business_id", business.id)
      .gte("starts_at", localToUtc(from, "00:00", business.timezone).toISOString())
      .lt("starts_at", localToUtc(to, "00:00", business.timezone).toISOString())
      .order("starts_at"),
    supabase
      .from("time_off")
      .select("*")
      .eq("business_id", business.id)
      .lt("starts_at", localToUtc(to, "00:00", business.timezone).toISOString())
      .gt("ends_at", localToUtc(from, "00:00", business.timezone).toISOString()),
    supabase.from("working_hours").select("*").eq("business_id", business.id),
    supabase
      .from("services")
      .select("id, name, duration_minutes, price_cents")
      .eq("business_id", business.id)
      .eq("active", true)
      .order("position"),
    supabase
      .from("combos")
      .select("id, name, price_cents")
      .eq("business_id", business.id)
      .eq("active", true),
  ]);

  let professionals = (pros.data ?? []) as Professional[];
  if (!context.isOwner)
    professionals = professionals.filter((p) => p.id === context.professionalId);
  const selectedPro = typeof params.pro === "string" ? params.pro : null;
  const visiblePros = selectedPro
    ? professionals.filter((p) => p.id === selectedPro)
    : professionals;
  const visibleIds = new Set(visiblePros.map((p) => p.id));

  const agendaAppointments: AgendaAppointment[] = (appointments.data ?? [])
    .filter((a) => visibleIds.has(a.professional_id as string))
    .map((a) => {
      const lines = [
        ...((a.appointment_services as { name: string; price_cents: number; position: number }[]) ??
          []),
      ].sort((x, y) => x.position - y.position);
      const customer = a.customer as { id: string; name: string; phone: string | null } | null;
      const date = formatInTimeZone(
        new Date(a.starts_at as string),
        business.timezone,
        "yyyy-MM-dd",
      );
      const startMinute = minutesOf(a.starts_at as string, business.timezone);
      const endDate = formatInTimeZone(
        new Date(a.ends_at as string),
        business.timezone,
        "yyyy-MM-dd",
      );
      return {
        id: a.id as string,
        professionalId: a.professional_id as string,
        status: a.status,
        source: a.source,
        startsAt: a.starts_at as string,
        endsAt: a.ends_at as string,
        date,
        startMinute,
        endMinute: endDate === date ? minutesOf(a.ends_at as string, business.timezone) : 24 * 60,
        timeLabel: `${formatInTimeZone(new Date(a.starts_at as string), business.timezone, "HH:mm")}–${formatInTimeZone(new Date(a.ends_at as string), business.timezone, "HH:mm")}`,
        customerId: customer?.id ?? "",
        customerName: customer?.name ?? "Cliente",
        customerPhone: customer?.phone ?? null,
        services: lines.map((l) => l.name).join(" + "),
        priceCents:
          lines.reduce((s, l) => s + l.price_cents, 0) - ((a.discount_cents as number) ?? 0),
        depositCents: a.deposit_cents as number,
        depositStatus: a.deposit_status as string,
        depositExpiresAt: (a.deposit_expires_at as string | null) ?? null,
      };
    });

  // Blocks split per local day of the range.
  const agendaBlocks: AgendaBlock[] = [];
  for (const block of blocks.data ?? []) {
    if (!visibleIds.has(block.professional_id as string)) continue;
    for (let day = from; day < to; day = addDaysToDate(day, 1)) {
      const dayStart = localToUtc(day, "00:00", business.timezone).getTime();
      const dayEnd = localToUtc(day, "24:00", business.timezone).getTime();
      const start = Math.max(dayStart, new Date(block.starts_at as string).getTime());
      const end = Math.min(dayEnd, new Date(block.ends_at as string).getTime());
      if (end <= start) continue;
      agendaBlocks.push({
        id: block.id as string,
        professionalId: block.professional_id as string,
        date: day,
        startMinute: Math.round((start - dayStart) / 60_000),
        endMinute: Math.round((end - dayStart) / 60_000),
        label: `${formatInTimeZone(new Date(start), business.timezone, "HH:mm")}–${formatInTimeZone(new Date(end), business.timezone, end === dayEnd ? "'24:00'" : "HH:mm")}`,
        reason: (block.reason as string | null) ?? null,
      });
    }
  }

  const ranges = ((hours.data ?? []) as WorkingHours[]).filter((h) =>
    visibleIds.has(h.professional_id),
  );
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const startMinute = Math.min(
    8 * 60,
    ...ranges.map((r) => toMin(r.start_time)),
    ...agendaAppointments.map((a) => a.startMinute),
  );
  const endMinute = Math.max(
    19 * 60,
    ...ranges.map((r) => toMin(r.end_time)),
    ...agendaAppointments.map((a) => a.endMinute),
  );

  const catalog: AgendaCatalog = {
    professionals: professionals.map((p) => ({ id: p.id, name: p.name })),
    services: (services.data ?? []).map((s) => ({
      id: s.id as string,
      name: s.name as string,
      durationMinutes: s.duration_minutes as number,
      priceCents: s.price_cents as number,
    })),
    combos: features.packagesAndCombos
      ? (combos.data ?? []).map((c) => ({
          id: c.id as string,
          name: c.name as string,
          priceCents: c.price_cents as number,
        }))
      : [],
  };

  return (
    <AgendaView
      view={view}
      date={date}
      from={from}
      today={today}
      timezone={business.timezone}
      appointments={agendaAppointments}
      blocks={agendaBlocks}
      catalog={catalog}
      visibleProfessionals={visiblePros.map((p) => ({ id: p.id, name: p.name }))}
      selectedProfessional={selectedPro}
      dayStartMinute={Math.floor(startMinute / 60) * 60}
      dayEndMinute={Math.ceil(endMinute / 60) * 60}
      canFilterProfessionals={context.isOwner && professionals.length > 1}
    />
  );
}
