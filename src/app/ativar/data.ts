import "server-only";

import {
  formatDateLong,
  formatTime,
  loadAppointmentDetails,
  serviceNames,
} from "@/lib/booking/details";
import { createAdminClient } from "@/lib/supabase/admin";

/** The owner's test booking, as shown on the result screen. */
export interface TestBooking {
  id: string;
  service: string;
  date: string;
  time: string;
  customer: string;
}

/**
 * First booking of the business: on a demonstration account it is the owner's test booking (the
 * demonstration ends right after it, so no other booking comes in before she pays).
 */
export async function loadTestBooking(businessId: string): Promise<TestBooking | null> {
  const { data } = await createAdminClient()
    .from("appointments")
    .select("id")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const details = await loadAppointmentDetails(data.id as string);
  if (!details) return null;
  const tz = details.business.timezone;
  return {
    id: details.appointment.id,
    service: serviceNames(details),
    date: formatDateLong(details.appointment.starts_at, tz),
    time: formatTime(details.appointment.starts_at, tz),
    customer: details.customer.name,
  };
}
