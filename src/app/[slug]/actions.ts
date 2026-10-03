"use server";

import { z } from "zod";

import {
  eligibleProfessionals,
  getDays,
  getSlots,
  loadCatalog,
  type Catalog,
} from "@/lib/booking/data";
import { rateLimitRequest } from "@/lib/rate-limit";
import { formatDateLong } from "@/lib/booking/details";
import { createAdminClient } from "@/lib/supabase/admin";

const REQUEST_DAYS_PAGE = 14;

/** Catalog for reading free days / times (any plan: nothing is reserved here). */
async function requestCatalog(businessId: string): Promise<Catalog | null> {
  const catalog = await loadCatalog(businessId);
  if (!catalog || catalog.business.suspended_at) return null;
  return catalog;
}

/** Service + its professional (the first one who does it: Free has a single professional). */
function requestSelection(catalog: Catalog, serviceId: string) {
  const service = catalog.services.find((s) => s.id === serviceId);
  if (!service) return null;
  const professional = eligibleProfessionals(catalog, [service])[0];
  if (!professional) return null;
  return { service, professional };
}

/** Times already asked for in open requests are not offered again (first come, first served). */
async function requestedStarts(businessId: string, professionalId: string): Promise<Set<number>> {
  const { data } = await createAdminClient()
    .from("booking_requests")
    .select("preferred_starts_at")
    .eq("business_id", businessId)
    .eq("professional_id", professionalId)
    .in("status", ["new", "contacted"])
    .gte("preferred_starts_at", new Date().toISOString());
  return new Set((data ?? []).map((r) => new Date(r.preferred_starts_at as string).getTime()));
}

async function freeRequestSlots(
  catalog: Catalog,
  selection: NonNullable<ReturnType<typeof requestSelection>>,
  date: string,
) {
  const [slots, taken] = await Promise.all([
    getSlots(
      { catalog, services: [selection.service], professional: selection.professional.id },
      date,
    ),
    requestedStarts(catalog.business.id, selection.professional.id),
  ]);
  return slots.filter((s) => !taken.has(new Date(s.startsAt).getTime()));
}

const requestSlotsSchema = z.object({ businessId: z.uuid(), serviceId: z.uuid() });

/** Days with at least one free time for the service (same engine as the booking chat). */
export async function getRequestDaysAction(
  input: unknown,
): Promise<{ date: string; label: string }[]> {
  if (!(await rateLimitRequest("slots"))) return [];
  const parsed = requestSlotsSchema
    .extend({ from: z.iso.date().nullable().default(null) })
    .safeParse(input);
  if (!parsed.success) return [];
  const catalog = await requestCatalog(parsed.data.businessId);
  const selection = catalog && requestSelection(catalog, parsed.data.serviceId);
  if (!catalog || !selection) return [];
  const days = await getDays(
    { catalog, services: [selection.service], professional: selection.professional.id },
    parsed.data.from,
    REQUEST_DAYS_PAGE,
  );
  return days.map((d) => ({ date: d.date, label: formatDateLong(`${d.date}T15:00:00Z`, "UTC") }));
}

/** Free times of a day for the service. */
export async function getRequestSlotsAction(
  input: unknown,
): Promise<{ startsAt: string; time: string }[]> {
  if (!(await rateLimitRequest("slots"))) return [];
  const parsed = requestSlotsSchema.extend({ date: z.iso.date() }).safeParse(input);
  if (!parsed.success) return [];
  const catalog = await requestCatalog(parsed.data.businessId);
  const selection = catalog && requestSelection(catalog, parsed.data.serviceId);
  if (!catalog || !selection) return [];
  const slots = await freeRequestSlots(catalog, selection, parsed.data.date);
  return slots.map((s) => ({ startsAt: s.startsAt, time: s.time }));
}
