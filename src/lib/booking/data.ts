import "server-only";

import {
  addDaysToDate,
  getAvailableDays,
  getAvailableSlots,
  getAvailableSlotsAnyProfessional,
  localToUtc,
  todayIn,
  weekdayOf,
  type AnyProfessionalSlot,
  type AvailabilityInput,
  type ServiceStep,
  type TimeRange,
} from "@/lib/availability";
import type {
  Business,
  Combo,
  Professional,
  ProfessionalService,
  Service,
  WorkingHours,
} from "@/lib/db/types";
import { ACTIVE_APPOINTMENT_STATUSES } from "@/lib/db/types";
import { getExternalBusy } from "@/lib/google/busy";
import { createAdminClient } from "@/lib/supabase/admin";

/** Static catalog of a business, loaded once per request. */
export interface Catalog {
  business: Business;
  services: Service[];
  professionals: Professional[];
  professionalServices: ProfessionalService[];
  serviceResources: { service_id: string; resource_id: string }[];
  combos: (Combo & { serviceIds: string[] })[];
  workingHours: WorkingHours[];
}

export async function loadCatalog(businessId: string): Promise<Catalog | null> {
  const admin = createAdminClient();
  const [business, services, professionals, links, resources, combos, hours] = await Promise.all([
    admin.from("businesses").select("*").eq("id", businessId).maybeSingle(),
    admin
      .from("services")
      .select("*")
      .eq("business_id", businessId)
      .eq("active", true)
      .order("position"),
    admin
      .from("professionals")
      .select("*")
      .eq("business_id", businessId)
      .eq("active", true)
      .order("position"),
    admin.from("professional_services").select("*").eq("business_id", businessId),
    admin.from("service_resources").select("service_id, resource_id").eq("business_id", businessId),
    admin
      .from("combos")
      .select("*, combo_services(service_id, position)")
      .eq("business_id", businessId)
      .eq("active", true),
    admin.from("working_hours").select("*").eq("business_id", businessId),
  ]);
  if (!business.data) return null;
  return {
    business: business.data as Business,
    services: (services.data ?? []) as Service[],
    professionals: (professionals.data ?? []) as Professional[],
    professionalServices: (links.data ?? []) as ProfessionalService[],
    serviceResources: resources.data ?? [],
    combos: (combos.data ?? []).map((c) => ({
      ...(c as Combo),
      serviceIds: [...((c.combo_services as { service_id: string; position: number }[]) ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((cs) => cs.service_id),
    })),
    workingHours: (hours.data ?? []) as WorkingHours[],
  };
}

export interface Selection {
  /** Services in booking order (a combo expands to its services). */
  serviceIds: string[];
  comboId?: string | null;
}

/** Expands a combo, checks every service is active. Null when the selection is invalid. */
export function resolveSelection(
  catalog: Catalog,
  selection: Selection,
): { services: Service[]; combo: Catalog["combos"][number] | null } | null {
  const combo = selection.comboId
    ? (catalog.combos.find((c) => c.id === selection.comboId) ?? null)
    : null;
  if (selection.comboId && !combo) return null;
  const ids = combo ? combo.serviceIds : selection.serviceIds;
  if (ids.length === 0) return null;
  const services = ids.map((id) => catalog.services.find((s) => s.id === id));
  if (services.some((s) => !s)) return null;
  return { services: services as Service[], combo };
}

/** Active professionals who do every service of the selection, in display order. */
export function eligibleProfessionals(catalog: Catalog, services: Service[]): Professional[] {
  return catalog.professionals.filter((p) =>
    services.every((s) =>
      catalog.professionalServices.some(
        (ps) => ps.professional_id === p.id && ps.service_id === s.id,
      ),
    ),
  );
}

/** Steps with this professional's duration overrides and each service's resources. */
export function stepsFor(
  catalog: Catalog,
  professionalId: string,
  services: Service[],
): ServiceStep[] {
  return services.map((service) => {
    const override = catalog.professionalServices.find(
      (ps) => ps.professional_id === professionalId && ps.service_id === service.id,
    );
    return {
      durationMinutes: override?.duration_override ?? service.duration_minutes,
      bufferMinutes: service.buffer_minutes,
      resourceIds: catalog.serviceResources
        .filter((sr) => sr.service_id === service.id)
        .map((sr) => sr.resource_id),
    };
  });
}

/** Price for this professional: combo price, or the sum of services with price overrides. */
export function priceFor(
  catalog: Catalog,
  professionalId: string,
  services: Service[],
  combo: Catalog["combos"][number] | null,
): number {
  if (combo) return combo.price_cents;
  return services.reduce((total, service) => {
    const override = catalog.professionalServices.find(
      (ps) => ps.professional_id === professionalId && ps.service_id === service.id,
    );
    return total + (override?.price_override ?? service.price_cents);
  }, 0);
}

interface BusyData {
  appointments: Map<string, TimeRange[]>;
  timeOff: Map<string, TimeRange[]>;
  resources: Map<string, TimeRange[]>;
  external: Map<string, TimeRange[]>;
}

const toRange = (row: { starts_at: string; ends_at: string }): TimeRange => ({
  start: new Date(row.starts_at),
  end: new Date(row.ends_at),
});

function push(map: Map<string, TimeRange[]>, key: string, range: TimeRange) {
  map.set(key, [...(map.get(key) ?? []), range]);
}

/** Busy intervals for the given professionals/resources in [from, to). */
async function loadBusy(
  businessId: string,
  brandKey: string,
  professionalIds: string[],
  resourceIds: string[],
  from: Date,
  to: Date,
  excludeAppointmentId?: string,
): Promise<BusyData> {
  const admin = createAdminClient();
  const [appointments, timeOff, resources, ...external] = await Promise.all([
    admin
      .from("appointments")
      .select("id, professional_id, starts_at, ends_at")
      .eq("business_id", businessId)
      .in("status", ACTIVE_APPOINTMENT_STATUSES)
      .in("professional_id", professionalIds)
      .lt("starts_at", to.toISOString())
      .gt("ends_at", from.toISOString()),
    admin
      .from("time_off")
      .select("professional_id, starts_at, ends_at")
      .eq("business_id", businessId)
      .in("professional_id", professionalIds)
      .lt("starts_at", to.toISOString())
      .gt("ends_at", from.toISOString()),
    resourceIds.length
      ? admin
          .from("appointment_resources")
          .select("appointment_id, resource_id, starts_at, ends_at")
          .eq("business_id", businessId)
          .eq("active", true)
          .in("resource_id", resourceIds)
          .lt("starts_at", to.toISOString())
          .gt("ends_at", from.toISOString())
      : Promise.resolve({
          data: [] as {
            appointment_id: string;
            resource_id: string;
            starts_at: string;
            ends_at: string;
          }[],
        }),
    ...professionalIds.map((id) => getExternalBusy(id, from, to, brandKey)),
  ]);

  const busy: BusyData = {
    appointments: new Map(),
    timeOff: new Map(),
    resources: new Map(),
    external: new Map(),
  };
  for (const row of appointments.data ?? []) {
    if (row.id !== excludeAppointmentId)
      push(busy.appointments, row.professional_id as string, toRange(row as never));
  }
  for (const row of timeOff.data ?? [])
    push(busy.timeOff, row.professional_id as string, toRange(row as never));
  for (const row of resources.data ?? []) {
    if (row.appointment_id !== excludeAppointmentId)
      push(busy.resources, row.resource_id, toRange(row));
  }
  professionalIds.forEach((id, i) => busy.external.set(id, external[i] ?? []));
  return busy;
}

export interface SlotQuery {
  catalog: Catalog;
  services: Service[];
  /** A professional id, or "any" (team plan only — checked by the caller). */
  professional: string | "any";
  now?: Date;
  /** Ignore this appointment's own reservations (rescheduling). */
  excludeAppointmentId?: string;
}

function dayInput(
  query: SlotQuery,
  date: string,
  professionalId: string,
  busy: BusyData,
  now: Date,
): AvailabilityInput {
  const { catalog } = query;
  const business = catalog.business;
  const weekday = weekdayOf(date);
  return {
    date,
    timezone: business.timezone,
    workingHours: catalog.workingHours
      .filter((h) => h.professional_id === professionalId && h.weekday === weekday)
      .map((h) => ({ startTime: h.start_time, endTime: h.end_time })),
    timeOff: busy.timeOff.get(professionalId) ?? [],
    appointments: busy.appointments.get(professionalId) ?? [],
    externalBusy: busy.external.get(professionalId) ?? [],
    services: stepsFor(catalog, professionalId, query.services),
    resourceBusy: Object.fromEntries(busy.resources),
    slotIntervalMinutes: business.slot_interval_minutes,
    minNoticeMinutes: business.min_notice_minutes,
    maxDaysAhead: business.max_days_ahead,
    now,
  };
}

function candidates(query: SlotQuery): Professional[] {
  const eligible = eligibleProfessionals(query.catalog, query.services);
  return query.professional === "any"
    ? eligible
    : eligible.filter((p) => p.id === query.professional);
}

function resourceIdsOf(query: SlotQuery): string[] {
  const ids = new Set(
    query.services.flatMap((s) =>
      query.catalog.serviceResources
        .filter((sr) => sr.service_id === s.id)
        .map((sr) => sr.resource_id),
    ),
  );
  return [...ids];
}

/** Free slots on one local date, with who is free at each start. */
export async function getSlots(query: SlotQuery, date: string): Promise<AnyProfessionalSlot[]> {
  const now = query.now ?? new Date();
  const pros = candidates(query);
  if (pros.length === 0) return [];
  const tz = query.catalog.business.timezone;
  const from = localToUtc(date, "00:00", tz);
  const to = localToUtc(date, "24:00", tz);
  const busy = await loadBusy(
    query.catalog.business.id,
    query.catalog.business.brand_key,
    pros.map((p) => p.id),
    resourceIdsOf(query),
    from,
    to,
    query.excludeAppointmentId,
  );

  if (pros.length === 1) {
    return getAvailableSlots(dayInput(query, date, pros[0]!.id, busy, now)).map((slot) => ({
      ...slot,
      professionalIds: [pros[0]!.id],
      endsAtByProfessional: { [pros[0]!.id]: slot.endsAt },
    }));
  }
  const base = dayInput(query, date, pros[0]!.id, busy, now);
  return getAvailableSlotsAnyProfessional({
    ...base,
    professionals: pros.map((p) => {
      const input = dayInput(query, date, p.id, busy, now);
      return {
        professionalId: p.id,
        workingHours: input.workingHours,
        timeOff: input.timeOff,
        appointments: input.appointments,
        externalBusy: input.externalBusy,
        services: input.services,
      };
    }),
  });
}

/** Next days (from today, business timezone) that have at least one free slot. */
export async function getDays(
  query: SlotQuery,
  fromDate: string | null,
  days: number,
): Promise<{ date: string; slotCount: number }[]> {
  const now = query.now ?? new Date();
  const pros = candidates(query);
  if (pros.length === 0) return [];
  const tz = query.catalog.business.timezone;
  const start = fromDate ?? todayIn(tz, now);
  const end = addDaysToDate(start, days);
  const busy = await loadBusy(
    query.catalog.business.id,
    query.catalog.business.brand_key,
    pros.map((p) => p.id),
    resourceIdsOf(query),
    localToUtc(start, "00:00", tz),
    localToUtc(end, "00:00", tz),
    query.excludeAppointmentId,
  );

  const perProfessional = pros.map((p) =>
    getAvailableDays({
      fromDate: start,
      days,
      buildInput: (date) => dayInput(query, date, p.id, busy, now),
    }),
  );
  const merged = new Map<string, number>();
  for (const list of perProfessional)
    for (const day of list)
      merged.set(day.date, Math.max(merged.get(day.date) ?? 0, day.slotCount));
  return [...merged.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, slotCount]) => ({ date, slotCount }));
}

/** Appointments per professional on a local date (round robin for "any professional"). */
export async function countAppointmentsOn(
  businessId: string,
  professionalIds: string[],
  date: string,
  timezone: string,
) {
  const { data } = await createAdminClient()
    .from("appointments")
    .select("professional_id")
    .eq("business_id", businessId)
    .in("status", ACTIVE_APPOINTMENT_STATUSES)
    .in("professional_id", professionalIds)
    .gte("starts_at", localToUtc(date, "00:00", timezone).toISOString())
    .lt("starts_at", localToUtc(date, "24:00", timezone).toISOString());
  const counts: Record<string, number> = {};
  for (const row of data ?? [])
    counts[row.professional_id as string] = (counts[row.professional_id as string] ?? 0) + 1;
  return counts;
}
