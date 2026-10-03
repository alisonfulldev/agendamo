import "server-only";

import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";

import { DEFAULT_BRAND, getBrand, type BrandConfig } from "@/brands";
import { brandUrl } from "@/brands/urls";
import type { Appointment, Business, Customer, PageSettings } from "@/lib/db/types";
import { formatAmount } from "@/lib/money";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AppointmentDetails {
  appointment: Appointment;
  business: Business;
  brand: BrandConfig;
  customer: Customer;
  professional: { id: string; name: string };
  services: { name: string; duration_minutes: number; price_cents: number }[];
  page: PageSettings | null;
  /** Business has more than one active professional (show the professional's name). */
  showProfessional: boolean;
}

export async function loadAppointmentDetails(
  appointmentId: string,
): Promise<AppointmentDetails | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("appointments")
    .select(
      "*, business:businesses(*), customer:customers(*), professional:professionals(id, name), appointment_services(name, duration_minutes, price_cents, position)",
    )
    .eq("id", appointmentId)
    .maybeSingle();
  if (!data) return null;
  const business = data.business as unknown as Business;
  const [{ data: page }, { count }] = await Promise.all([
    admin.from("page_settings").select("*").eq("business_id", business.id).maybeSingle(),
    admin
      .from("professionals")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("active", true),
  ]);
  const services = [
    ...((data.appointment_services as {
      name: string;
      duration_minutes: number;
      price_cents: number;
      position: number;
    }[]) ?? []),
  ].sort((a, b) => a.position - b.position);
  return {
    appointment: data as unknown as Appointment,
    business,
    brand: getBrand(business.brand_key) ?? DEFAULT_BRAND,
    customer: data.customer as unknown as Customer,
    professional: data.professional as unknown as { id: string; name: string },
    services,
    page: page as PageSettings | null,
    showProfessional: (count ?? 0) > 1,
  };
}

/** "terça, 8 de janeiro" */
export function formatDateLong(iso: string, timezone: string): string {
  return formatInTimeZone(new Date(iso), timezone, "EEEE, d 'de' MMMM", { locale: ptBR });
}

export function formatTime(iso: string, timezone: string): string {
  return formatInTimeZone(new Date(iso), timezone, "HH:mm");
}

export function serviceNames(details: Pick<AppointmentDetails, "services">): string {
  return details.services.map((s) => s.name).join(" + ");
}

/** End of the service itself (stored ends_at includes buffers). */
export function serviceEnd(details: AppointmentDetails): Date {
  const minutes = details.services.reduce((sum, s) => sum + s.duration_minutes, 0);
  return new Date(new Date(details.appointment.starts_at).getTime() + minutes * 60_000);
}

export function totalPrice(details: AppointmentDetails): number {
  return (
    details.services.reduce((sum, s) => sum + s.price_cents, 0) - details.appointment.discount_cents
  );
}

/** Cancel / reschedule page for the customer, on the business's brand domain. */
export function manageUrl(details: AppointmentDetails): string {
  return brandUrl(details.brand, `/cancelar/${details.appointment.cancel_token}`);
}

export function priceText(cents: number): string {
  return formatAmount(cents);
}
