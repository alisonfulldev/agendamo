import "server-only";

import { formatInTimeZone } from "date-fns-tz";
import { z } from "zod";

import { todayIn } from "@/lib/availability";
import { createBooking } from "@/lib/booking/create";
import {
  eligibleProfessionals,
  getDays,
  getSlots,
  loadCatalog,
  resolveSelection,
  type Catalog,
} from "@/lib/booking/data";
import {
  formatDateLong,
  formatTime,
  loadAppointmentDetails,
  manageUrl,
  serviceNames,
  totalPrice,
} from "@/lib/booking/details";
import { cancelAppointment, rescheduleAppointment } from "@/lib/booking/manage";
import { depositBrCode, notifyBookingCreated } from "@/lib/booking/notify";
import { ACTIVE_APPOINTMENT_STATUSES } from "@/lib/db/types";
import { formatAmount } from "@/lib/money";
import { getPlanFeatures } from "@/lib/plans";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

import { schemas, type ToolName } from "./tools";

/**
 * Booking operations for the owner's own AI (MCP server and REST API). Same rules as the booking
 * chat: only offered slots, plan checked on the server (rule 6), deposits by Pix to the owner.
 */

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

interface Context {
  catalog: Catalog;
  showPrices: boolean;
}

async function context(businessId: string): Promise<Context> {
  const catalog = await loadCatalog(businessId);
  if (!catalog || catalog.business.suspended_at)
    throw new ApiError("not_found", "Negócio não encontrado.", 404);
  if (!getPlanFeatures(catalog.business).agenda)
    throw new ApiError(
      "plan_inactive",
      "A agenda deste negócio está indisponível (assinatura do MeetChat pendente). Peça para o cliente falar direto com o negócio.",
      402,
    );
  const { data: page } = await createAdminClient()
    .from("page_settings")
    .select("show_prices")
    .eq("business_id", businessId)
    .maybeSingle();
  return { catalog, showPrices: (page?.show_prices as boolean | undefined) ?? true };
}

function resolve(ctx: Context, input: z.infer<typeof schemas.list_available_days>) {
  const { catalog } = ctx;
  const resolved = resolveSelection(catalog, {
    serviceIds: input.service_ids,
    comboId: input.combo_id ?? null,
  });
  if (!resolved)
    throw new ApiError("invalid_selection", "Serviço ou combo inválido. Use get_business_info.");
  const eligible = eligibleProfessionals(catalog, resolved.services);
  let professional: string = input.professional_id ?? "any";
  if (professional === "any" && !getPlanFeatures(catalog.business).anyProfessional)
    professional = eligible[0]?.id ?? "any";
  if (professional !== "any" && !eligible.some((p) => p.id === professional))
    throw new ApiError("invalid_professional", "Este profissional não faz o serviço escolhido.");
  return { ...resolved, professional };
}

function money(ctx: Context, cents: number): string | null {
  return ctx.showPrices && cents > 0 ? `R$ ${formatAmount(cents)}` : null;
}

export async function getBusinessInfo(businessId: string) {
  const ctx = await context(businessId);
  const { catalog } = ctx;
  const tz = catalog.business.timezone;
  const now = new Date();
  const features = getPlanFeatures(catalog.business);
  const { data: page } = await createAdminClient()
    .from("page_settings")
    .select("pix_key, deposit_policy_text, address, neighborhood, city")
    .eq("business_id", businessId)
    .maybeSingle();
  const depositOn = features.deposits && Boolean(page?.pix_key);
  const services = catalog.services.filter((s) => eligibleProfessionals(catalog, [s]).length > 0);
  return {
    business: catalog.business.name,
    timezone: tz,
    now: formatInTimeZone(now, tz, "yyyy-MM-dd'T'HH:mmXXX"),
    today: `${formatDateLong(now.toISOString(), tz)} (${todayIn(tz, now)})`,
    address: page?.address
      ? [page.address, page.neighborhood, page.city].filter(Boolean).join(", ")
      : null,
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description ?? null,
      duration_minutes: s.duration_minutes,
      price: money(ctx, s.price_cents),
      asks_deposit:
        depositOn &&
        (s.deposit_type === "fixed" || (s.deposit_type !== "none" && s.price_cents > 0)),
    })),
    combos: features.packagesAndCombos
      ? catalog.combos
          .filter((c) => resolveSelection(catalog, { serviceIds: [], comboId: c.id }))
          .map((c) => ({
            id: c.id,
            name: c.name,
            service_ids: c.serviceIds,
            price: money(ctx, c.price_cents),
          }))
      : [],
    professionals:
      catalog.professionals.length > 1
        ? catalog.professionals.map((p) => ({
            id: p.id,
            name: p.name,
            service_ids: catalog.professionalServices
              .filter((ps) => ps.professional_id === p.id)
              .map((ps) => ps.service_id),
          }))
        : [],
    deposit_policy: depositOn ? (page?.deposit_policy_text as string | null)?.trim() || null : null,
  };
}

export async function listAvailableDays(
  businessId: string,
  input: z.infer<typeof schemas.list_available_days>,
) {
  const ctx = await context(businessId);
  const sel = resolve(ctx, input);
  const days = await getDays(
    { catalog: ctx.catalog, services: sel.services, professional: sel.professional },
    input.from_date ?? null,
    14,
  );
  return {
    days: days.map((d) => ({
      date: d.date,
      label: formatDateLong(`${d.date}T15:00:00Z`, "UTC"),
      free_times: d.slotCount,
    })),
  };
}

export async function listAvailableTimes(
  businessId: string,
  input: z.infer<typeof schemas.list_available_times>,
) {
  const ctx = await context(businessId);
  const sel = resolve(ctx, input);
  const slots = await getSlots(
    { catalog: ctx.catalog, services: sel.services, professional: sel.professional },
    input.date,
  );
  return {
    date: input.date,
    label: formatDateLong(`${input.date}T15:00:00Z`, "UTC"),
    times: slots.map((s) => ({ time: s.time, starts_at: s.startsAt })),
  };
}

const BOOKING_ERRORS: Record<string, string> = {
  conflict: "Esse horário acabou de ser ocupado. Consulte list_available_times de novo.",
  unavailable: "Esse horário acabou de ser ocupado. Consulte list_available_times de novo.",
  blocked: "Não foi possível agendar para este cliente. Peça para ele falar com o negócio.",
  invalid: "Dados do agendamento inválidos.",
  coupon_invalid: "Cupom inválido.",
  limit: "A agenda deste negócio está indisponível no momento.",
};

export async function createAppointment(
  businessId: string,
  input: z.infer<typeof schemas.create_appointment>,
) {
  if (!(await rateLimit("booking", `api:${businessId}:${input.customer_phone}`)))
    throw new ApiError(
      "rate_limited",
      "Muitos agendamentos para este telefone. Tente mais tarde.",
      429,
    );
  const ctx = await context(businessId);
  const sel = resolve(ctx, input);
  const result = await createBooking({
    catalog: ctx.catalog,
    selection: { serviceIds: input.service_ids, comboId: input.combo_id ?? null },
    professional: sel.professional,
    startsAt: input.starts_at,
    customer: {
      name: input.customer_name,
      phone: input.customer_phone,
      email: input.customer_email ?? null,
      marketingOptIn: false,
    },
    source: "chat",
    depositPolicyAccepted: input.deposit_policy_accepted,
  });
  if (!result.ok) {
    if (result.error === "policy_required") {
      const { data: page } = await createAdminClient()
        .from("page_settings")
        .select("deposit_policy_text")
        .eq("business_id", businessId)
        .maybeSingle();
      throw new ApiError(
        "deposit_policy_required",
        `Este serviço pede sinal pelo Pix. Mostre a política ao cliente e, se ele aceitar, chame de novo com deposit_policy_accepted=true. Política: ${(page?.deposit_policy_text as string | null)?.trim() ?? ""}`,
      );
    }
    throw new ApiError(
      result.error,
      BOOKING_ERRORS[result.error] ?? "Não foi possível agendar.",
      409,
    );
  }

  await notifyBookingCreated(result.booking.id);
  return appointmentView(result.booking.id, { withPix: true });
}

async function appointmentView(appointmentId: string, options: { withPix?: boolean } = {}) {
  const d = await loadAppointmentDetails(appointmentId);
  if (!d) throw new ApiError("not_found", "Agendamento não encontrado.", 404);
  const tz = d.business.timezone;
  const a = d.appointment;
  const pix = options.withPix && a.status === "awaiting_deposit" ? depositBrCode(d) : null;
  const total = totalPrice(d);
  return {
    id: a.id,
    status: a.status,
    status_text: STATUS_TEXT[a.status] ?? a.status,
    service: serviceNames(d),
    professional: d.showProfessional ? d.professional.name : null,
    date: formatDateLong(a.starts_at, tz),
    time: formatTime(a.starts_at, tz),
    starts_at: a.starts_at,
    price: total > 0 ? `R$ ${formatAmount(total)}` : null,
    manage_url: manageUrl(d),
    deposit:
      a.status === "awaiting_deposit" && a.deposit_cents > 0
        ? {
            amount: `R$ ${formatAmount(a.deposit_cents)}`,
            pix_copy_paste: pix,
            pay_until: a.deposit_expires_at
              ? `${formatTime(a.deposit_expires_at, tz)} de ${formatInTimeZone(new Date(a.deposit_expires_at), tz, "dd/MM")}`
              : null,
            instructions:
              "O cliente paga o Pix e depois toca em “Já fiz o Pix” no manage_url (pode anexar o comprovante). Sem isso até o prazo, o horário é liberado.",
          }
        : null,
  };
}

const STATUS_TEXT: Record<string, string> = {
  confirmed: "Confirmado",
  pending: "Aguardando aprovação do negócio",
  awaiting_deposit: "Reservado, aguardando o Pix do sinal",
  cancelled: "Cancelado",
  completed: "Realizado",
  no_show: "Não compareceu",
};

/** Customer of this business with this phone, or null. */
async function customerId(businessId: string, phone: string): Promise<string | null> {
  const { data } = await createAdminClient()
    .from("customers")
    .select("id")
    .eq("business_id", businessId)
    .eq("phone", phone)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

export async function findAppointments(
  businessId: string,
  input: z.infer<typeof schemas.find_appointments>,
) {
  await context(businessId);
  const id = await customerId(businessId, input.customer_phone);
  if (!id) return { appointments: [] };
  const { data } = await createAdminClient()
    .from("appointments")
    .select("id")
    .eq("business_id", businessId)
    .eq("customer_id", id)
    .in("status", ACTIVE_APPOINTMENT_STATUSES)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(10);
  const appointments = await Promise.all(
    (data ?? []).map((row) => appointmentView(row.id as string, { withPix: true })),
  );
  return { appointments };
}

/** The appointment must belong to this business and to the customer with this phone. */
async function ownedAppointment(businessId: string, appointmentId: string, phone: string) {
  const id = await customerId(businessId, phone);
  const { data } = id
    ? await createAdminClient()
        .from("appointments")
        .select("id, status")
        .eq("id", appointmentId)
        .eq("business_id", businessId)
        .eq("customer_id", id)
        .maybeSingle()
    : { data: null };
  if (!data) throw new ApiError("not_found", "Agendamento não encontrado para este telefone.", 404);
  if (!ACTIVE_APPOINTMENT_STATUSES.includes(data.status as never))
    throw new ApiError("not_active", "Este agendamento não está mais ativo.", 409);
}

export async function cancelAppointmentByCustomer(
  businessId: string,
  input: z.infer<typeof schemas.cancel_appointment>,
) {
  await context(businessId);
  await ownedAppointment(businessId, input.appointment_id, input.customer_phone);
  const ok = await cancelAppointment(input.appointment_id, "customer");
  if (!ok) throw new ApiError("not_active", "Este agendamento não está mais ativo.", 409);
  return appointmentView(input.appointment_id);
}

export async function rescheduleAppointmentByCustomer(
  businessId: string,
  input: z.infer<typeof schemas.reschedule_appointment>,
) {
  await context(businessId);
  await ownedAppointment(businessId, input.appointment_id, input.customer_phone);
  const result = await rescheduleAppointment(input.appointment_id, input.new_starts_at, "customer");
  if (!result.ok)
    throw new ApiError(
      result.error,
      result.error === "conflict"
        ? "Esse horário não está livre. Consulte list_available_times de novo."
        : "Não foi possível remarcar.",
      409,
    );
  return appointmentView(input.appointment_id, { withPix: true });
}

const HANDLERS: { [K in ToolName]: (businessId: string, input: never) => Promise<unknown> } = {
  get_business_info: (id) => getBusinessInfo(id),
  list_available_days: listAvailableDays,
  list_available_times: listAvailableTimes,
  create_appointment: createAppointment,
  find_appointments: findAppointments,
  cancel_appointment: cancelAppointmentByCustomer,
  reschedule_appointment: rescheduleAppointmentByCustomer,
};

/** Validates the input with zod (rule 9), applies the per-key limit and runs the operation. */
export async function runTool(
  auth: { keyId: string; businessId: string },
  name: ToolName,
  rawInput: unknown,
): Promise<unknown> {
  if (!(await rateLimit("api", `key:${auth.keyId}`)))
    throw new ApiError(
      "rate_limited",
      "Limite de chamadas atingido. Tente em alguns minutos.",
      429,
    );
  const parsed = schemas[name].safeParse(rawInput ?? {});
  if (!parsed.success)
    throw new ApiError(
      "invalid_input",
      parsed.error.issues.map((i) => `${i.path.join(".") || "entrada"}: ${i.message}`).join("; "),
    );
  return HANDLERS[name](auth.businessId, parsed.data as never);
}
