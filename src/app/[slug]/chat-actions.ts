"use server";

import { formatInTimeZone } from "date-fns-tz";
import QRCode from "qrcode";
import { z } from "zod";

import { createBooking } from "@/lib/booking/create";
import {
  getDays,
  getSlots,
  loadCatalog,
  priceFor,
  resolveSelection,
  eligibleProfessionals,
  type Catalog,
} from "@/lib/booking/data";
import {
  formatDateLong,
  formatTime,
  loadAppointmentDetails,
  manageUrl,
  serviceEnd,
  serviceNames,
} from "@/lib/booking/details";
import { depositBrCode, notifyBookingCreated } from "@/lib/booking/notify";
import { googleCalendarUrl } from "@/lib/ics";
import { formatAmount } from "@/lib/money";
import { normalizeBrPhone } from "@/lib/phone";
import { getPlanFeatures } from "@/lib/plans";
import { rateLimitRequest } from "@/lib/rate-limit";
import { isValidSlugFormat } from "@/lib/slug";
import { publicUrl } from "@/lib/storage/r2";
import { createAdminClient } from "@/lib/supabase/admin";

const DAYS_PAGE = 14;

/** Catalog of a business whose plan has the booking chat; null otherwise (checked on the server). */
async function chatCatalog(slug: string): Promise<Catalog | null> {
  if (!isValidSlugFormat(slug)) return null;
  const { data } = await createAdminClient()
    .from("businesses")
    .select("id, suspended_at")
    .eq("slug", slug)
    .maybeSingle();
  if (!data || data.suspended_at) return null;
  const catalog = await loadCatalog(data.id as string);
  if (!catalog || !getPlanFeatures(catalog.business).chatBooking) return null;
  return catalog;
}

export interface ChatCatalog {
  businessName: string;
  timezone: string;
  showPrices: boolean;
  whatsapp: string | null;
  anyProfessional: boolean;
  /** Coupons and waitlist (sales tools). */
  salesTools: boolean;
  services: { id: string; name: string; durationMinutes: number; priceCents: number }[];
  combos: {
    id: string;
    name: string;
    serviceIds: string[];
    durationMinutes: number;
    priceCents: number;
  }[];
  professionals: { id: string; name: string; photoUrl: string | null; serviceIds: string[] }[];
}

export async function getChatCatalogAction(slug: string): Promise<ChatCatalog | null> {
  const catalog = await chatCatalog(slug);
  if (!catalog) return null;
  const features = getPlanFeatures(catalog.business);
  const { data: page } = await createAdminClient()
    .from("page_settings")
    .select("show_prices, whatsapp_number")
    .eq("business_id", catalog.business.id)
    .maybeSingle();
  return {
    businessName: catalog.business.name,
    timezone: catalog.business.timezone,
    showPrices: (page?.show_prices as boolean | undefined) ?? true,
    whatsapp: (page?.whatsapp_number as string | null) ?? null,
    anyProfessional: features.anyProfessional && catalog.professionals.length > 1,
    salesTools: features.salesTools,
    services: catalog.services
      .filter((s) => eligibleProfessionals(catalog, [s]).length > 0)
      .map((s) => ({
        id: s.id,
        name: s.name,
        durationMinutes: s.duration_minutes,
        priceCents: s.price_cents,
      })),
    combos: features.packagesAndCombos
      ? catalog.combos
          .filter((c) => resolveSelection(catalog, { serviceIds: [], comboId: c.id }))
          .map((c) => ({
            id: c.id,
            name: c.name,
            serviceIds: c.serviceIds,
            durationMinutes: c.serviceIds.reduce(
              (sum, id) => sum + (catalog.services.find((s) => s.id === id)?.duration_minutes ?? 0),
              0,
            ),
            priceCents: c.price_cents,
          }))
      : [],
    professionals: features.anyProfessional
      ? catalog.professionals.map((p) => ({
          id: p.id,
          name: p.name,
          photoUrl: publicUrl(p.photo_key),
          serviceIds: catalog.professionalServices
            .filter((ps) => ps.professional_id === p.id)
            .map((ps) => ps.service_id),
        }))
      : [],
  };
}

const selectionSchema = z.object({
  slug: z.string().max(40),
  serviceIds: z.array(z.uuid()).max(6).default([]),
  comboId: z.uuid().nullable().default(null),
  professional: z.union([z.literal("any"), z.uuid()]).default("any"),
});

/** Resolves the selection; "any professional" is only honored on the Team plan. */
async function resolve(input: z.infer<typeof selectionSchema>) {
  const catalog = await chatCatalog(input.slug);
  if (!catalog) return null;
  const resolved = resolveSelection(catalog, input);
  if (!resolved) return null;
  const eligible = eligibleProfessionals(catalog, resolved.services);
  let professional = input.professional;
  if (professional === "any" && !getPlanFeatures(catalog.business).anyProfessional) {
    professional = eligible[0]?.id ?? "any";
  }
  if (professional !== "any" && !eligible.some((p) => p.id === professional)) return null;
  return { catalog, ...resolved, professional };
}

export async function getChatDaysAction(
  input: unknown,
): Promise<{ date: string; label: string }[]> {
  if (!(await rateLimitRequest("slots"))) return [];
  const parsed = selectionSchema
    .extend({ from: z.iso.date().nullable().default(null) })
    .safeParse(input);
  if (!parsed.success) return [];
  const ctx = await resolve(parsed.data);
  if (!ctx) return [];
  const days = await getDays(
    { catalog: ctx.catalog, services: ctx.services, professional: ctx.professional },
    parsed.data.from,
    DAYS_PAGE,
  );
  return days.map((d) => ({ date: d.date, label: formatDateLong(`${d.date}T15:00:00Z`, "UTC") }));
}

export async function getChatSlotsAction(
  input: unknown,
): Promise<{ startsAt: string; time: string }[]> {
  if (!(await rateLimitRequest("slots"))) return [];
  const parsed = selectionSchema.extend({ date: z.iso.date() }).safeParse(input);
  if (!parsed.success) return [];
  const ctx = await resolve(parsed.data);
  if (!ctx) return [];
  const slots = await getSlots(
    { catalog: ctx.catalog, services: ctx.services, professional: ctx.professional },
    parsed.data.date,
  );
  return slots.map((s) => ({ startsAt: s.startsAt, time: s.time }));
}

export async function previewCouponAction(
  input: unknown,
): Promise<{ ok: true; discountCents: number } | { ok: false }> {
  if (!(await rateLimitRequest("publicAction", "coupon"))) return { ok: false };
  const parsed = selectionSchema
    .extend({ code: z.string().trim().min(3).max(30) })
    .safeParse(input);
  if (!parsed.success) return { ok: false };
  const ctx = await resolve(parsed.data);
  if (!ctx || !getPlanFeatures(ctx.catalog.business).salesTools) return { ok: false };
  const professionalId =
    ctx.professional === "any"
      ? (eligibleProfessionals(ctx.catalog, ctx.services)[0]?.id ?? "")
      : ctx.professional;
  const amount = priceFor(ctx.catalog, professionalId, ctx.services, ctx.combo);
  const { data } = await createAdminClient().rpc("preview_business_coupon", {
    p_business_id: ctx.catalog.business.id,
    p_code: parsed.data.code,
    p_amount: amount,
  });
  return data === null || data === undefined
    ? { ok: false }
    : { ok: true, discountCents: data as number };
}

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().transform((v, ctx) => {
    const phone = normalizeBrPhone(v);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "WhatsApp inválido" });
      return z.NEVER;
    }
    return phone;
  }),
  email: z.preprocess((v) => (v === "" ? null : v), z.email().max(200).nullable()),
});

/**
 * Stores an unfinished booking for the owner's "Quase agendaram" list. Only with consent
 * (the opt-in box); without it nothing is written. Returns the id to update later.
 */
export async function saveAbandonedAction(input: unknown): Promise<string | null> {
  const parsed = selectionSchema
    .merge(contactSchema.partial())
    .extend({
      consent: z.literal(true),
      date: z.iso.date().nullable().default(null),
      slot: z.iso.datetime({ offset: true }).nullable().default(null),
      id: z.uuid().nullable().default(null),
    })
    .safeParse(input);
  if (!parsed.success) return null;
  if (!(await rateLimitRequest("publicAction", "abandoned"))) return null;
  const catalog = await chatCatalog(parsed.data.slug);
  if (!catalog) return null;
  const row = {
    business_id: catalog.business.id,
    service_ids: parsed.data.comboId
      ? (catalog.combos.find((c) => c.id === parsed.data.comboId)?.serviceIds ?? [])
      : parsed.data.serviceIds,
    date: parsed.data.date,
    slot: parsed.data.slot,
    customer_name: parsed.data.name ?? null,
    phone: parsed.data.phone ?? null,
    email: parsed.data.email ?? null,
    consent: true,
  };
  const admin = createAdminClient();
  if (parsed.data.id) {
    await admin
      .from("abandoned_bookings")
      .update(row)
      .eq("id", parsed.data.id)
      .eq("business_id", catalog.business.id)
      .eq("status", "open");
    return parsed.data.id;
  }
  const { data } = await admin.from("abandoned_bookings").insert(row).select("id").single();
  return (data?.id as string | undefined) ?? null;
}

export async function joinWaitlistAction(
  input: unknown,
): Promise<{ ok: boolean; message?: string }> {
  const parsed = selectionSchema
    .merge(contactSchema)
    .extend({ date: z.iso.date() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, message: "Confira seus dados." };
  if (!(await rateLimitRequest("bookingRequest", `phone:${parsed.data.phone}`))) {
    return { ok: false, message: "Muitas tentativas. Tente mais tarde." };
  }
  const ctx = await resolve(parsed.data);
  if (!ctx || !getPlanFeatures(ctx.catalog.business).salesTools)
    return { ok: false, message: "Lista de espera indisponível." };
  const { error } = await createAdminClient()
    .from("waitlist_entries")
    .insert({
      business_id: ctx.catalog.business.id,
      service_id: ctx.services[0]!.id,
      professional_id: ctx.professional === "any" ? null : ctx.professional,
      date: parsed.data.date,
      customer_name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
    });
  return error ? { ok: false, message: "Não foi possível entrar na lista." } : { ok: true };
}

export type ConfirmResult =
  | {
      ok: true;
      status: "confirmed" | "pending" | "awaiting_deposit";
      vars: Record<string, string>;
      cancelToken: string;
      pix: { code: string; qr: string } | null;
      whatsappSummary: string | null;
      /** Pre-filled Google Calendar link ("Salvar na minha agenda"). */
      googleCalendarUrl: string | null;
    }
  | { ok: false; error: "conflict" | "blocked" | "invalid" | "coupon_invalid" | "rate_limited" };

export async function confirmChatBookingAction(input: unknown): Promise<ConfirmResult> {
  const parsed = selectionSchema
    .merge(contactSchema)
    .extend({
      startsAt: z.iso.datetime({ offset: true }),
      optIn: z.boolean().default(false),
      couponCode: z.string().trim().max(30).nullable().default(null),
      referralCode: z.string().trim().max(40).nullable().default(null),
      abandonedId: z.uuid().nullable().default(null),
    })
    .safeParse(input);
  if (!parsed.success) {
    console.warn("chat booking refused: invalid input", parsed.error.issues);
    return { ok: false, error: "invalid" };
  }
  const data = parsed.data;
  if (!(await rateLimitRequest("booking", `phone:${data.phone}`))) {
    console.warn("chat booking refused: rate limited", data.slug);
    return { ok: false, error: "rate_limited" };
  }

  const ctx = await resolve(data);
  if (!ctx) {
    console.warn("chat booking refused: business/selection not available", data.slug);
    return { ok: false, error: "invalid" };
  }
  const features = getPlanFeatures(ctx.catalog.business);
  const result = await createBooking({
    catalog: ctx.catalog,
    selection: { serviceIds: data.serviceIds, comboId: data.comboId },
    professional: ctx.professional,
    startsAt: data.startsAt,
    customer: { name: data.name, phone: data.phone, email: data.email, marketingOptIn: data.optIn },
    source: "chat",
    couponCode: features.salesTools ? data.couponCode : null,
    referralCode: data.referralCode,
  });
  if (!result.ok) {
    if (result.error === "invalid")
      console.warn("chat booking refused by createBooking", data.slug);
    return { ok: false, error: result.error === "unavailable" ? "conflict" : result.error };
  }

  const admin = createAdminClient();
  if (data.abandonedId) {
    await admin
      .from("abandoned_bookings")
      .update({ status: "resolved" })
      .eq("id", data.abandonedId);
  }
  await notifyBookingCreated(result.booking.id);

  const details = await loadAppointmentDetails(result.booking.id);
  const tz = ctx.catalog.business.timezone;
  const code = details ? depositBrCode(details) : null;
  const serviceName = ctx.combo ? ctx.combo.name : ctx.services.map((s) => s.name).join(" + ");
  const professionalName =
    ctx.catalog.professionals.find((p) => p.id === result.booking.professionalId)?.name ?? "";
  const vars = {
    business: ctx.catalog.business.name,
    service: serviceName,
    professional: professionalName,
    date: formatDateLong(result.booking.startsAt, tz),
    time: formatTime(result.booking.startsAt, tz),
    price: formatAmount(result.booking.priceCents),
    customerName: data.name.split(" ")[0]!,
    depositAmount: formatAmount(result.booking.depositCents),
    deadline: result.booking.depositExpiresAt
      ? `${formatTime(result.booking.depositExpiresAt, tz)} de ${formatInTimeZone(new Date(result.booking.depositExpiresAt), tz, "dd/MM")}`
      : "",
  };
  const { data: page } = await admin
    .from("page_settings")
    .select("whatsapp_number")
    .eq("business_id", ctx.catalog.business.id)
    .maybeSingle();

  return {
    ok: true,
    status: result.booking.status as "confirmed" | "pending" | "awaiting_deposit",
    vars,
    cancelToken: result.booking.cancelToken,
    googleCalendarUrl: details
      ? googleCalendarUrl({
          start: new Date(details.appointment.starts_at),
          end: serviceEnd(details),
          title: `${serviceNames(details)} · ${details.business.name}`,
          location: details.page?.address
            ? [details.page.address, details.page.neighborhood, details.page.city]
                .filter(Boolean)
                .join(", ")
            : undefined,
          description: `Remarcar ou cancelar: ${manageUrl(details)}`,
        })
      : null,
    pix: code ? { code, qr: await QRCode.toDataURL(code, { width: 320, margin: 1 }) } : null,
    whatsappSummary: page?.whatsapp_number
      ? `Olá, ${ctx.catalog.business.name}! Acabei de agendar ${serviceName} para ${vars.date} às ${vars.time}. Nome: ${data.name}.`
      : null,
  };
}
