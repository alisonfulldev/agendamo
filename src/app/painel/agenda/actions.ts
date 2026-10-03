"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { localToUtc } from "@/lib/availability";
import { createBooking } from "@/lib/booking/create";
import { getSlots, loadCatalog, resolveSelection } from "@/lib/booking/data";
import {
  approveAppointment,
  cancelAppointment,
  completeAppointment,
  confirmDeposit,
  markNoShow,
  rescheduleAppointment,
} from "@/lib/booking/manage";
import { notifyBookingCreated } from "@/lib/booking/notify";
import { requireBusiness, type BusinessContext } from "@/lib/business/context";
import { invalidatePublicPage } from "@/lib/cache";
import { normalizeBrPhone } from "@/lib/phone";
import { getPlanFeatures } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** Agenda features need Pro/Team (or an active trial), checked on the server (rule 6). */
async function requireAgenda(): Promise<BusinessContext> {
  const context = await requireBusiness();
  if (!getPlanFeatures(context.business).agenda)
    throw new Error("Agenda disponível no Pro e no Equipe.");
  return context;
}

/** Staff may only act on their own professional. */
function allowedProfessional(context: BusinessContext, professionalId: string): boolean {
  return context.isOwner || context.professionalId === professionalId;
}

async function assertAppointment(context: BusinessContext, appointmentId: string) {
  const { data } = await createAdminClient()
    .from("appointments")
    .select("id, business_id, professional_id")
    .eq("id", appointmentId)
    .maybeSingle();
  if (
    !data ||
    data.business_id !== context.business.id ||
    !allowedProfessional(context, data.professional_id as string)
  ) {
    throw new Error("Agendamento não encontrado.");
  }
  return data;
}

function refresh(context: BusinessContext) {
  revalidatePath("/painel/agenda");
  invalidatePublicPage(context.business.slug);
}

const selectionSchema = z.object({
  serviceIds: z.array(z.uuid()).max(6).default([]),
  comboId: z.uuid().nullable().default(null),
});

export interface AgendaSlot {
  startsAt: string;
  time: string;
  professionalIds: string[];
}

const slotsSchema = selectionSchema.extend({
  professionalId: z.uuid(),
  date: z.iso.date(),
  excludeAppointmentId: z.uuid().optional(),
});

export async function getAgendaSlotsAction(input: unknown): Promise<AgendaSlot[]> {
  const context = await requireAgenda();
  const parsed = slotsSchema.parse(input);
  if (!allowedProfessional(context, parsed.professionalId)) return [];
  const catalog = await loadCatalog(context.business.id);
  if (!catalog) return [];

  let services = resolveSelection(catalog, parsed)?.services;
  if (parsed.excludeAppointmentId && !services) {
    // Rescheduling: use the appointment's own services.
    const { data: lines } = await createAdminClient()
      .from("appointment_services")
      .select("service_id, position")
      .eq("appointment_id", parsed.excludeAppointmentId)
      .order("position");
    services = resolveSelection(catalog, {
      serviceIds: (lines ?? []).map((l) => l.service_id as string),
    })?.services;
  }
  if (!services) return [];

  const slots = await getSlots(
    {
      catalog,
      services,
      professional: parsed.professionalId,
      excludeAppointmentId: parsed.excludeAppointmentId,
    },
    parsed.date,
  );
  return slots.map((s) => ({
    startsAt: s.startsAt,
    time: s.time,
    professionalIds: s.professionalIds,
  }));
}

export interface CustomerOption {
  id: string;
  name: string;
  phone: string | null;
  blocked: boolean;
}

export async function searchCustomersAction(query: string): Promise<CustomerOption[]> {
  await requireAgenda();
  const term = z.string().trim().min(2).max(60).safeParse(query);
  if (!term.success) return [];
  const digits = term.data.replace(/\D/g, "");
  const supabase = await createClient();
  let request = supabase.from("customers").select("id, name, phone, blocked").limit(10);
  request =
    digits.length >= 4
      ? request.like("phone", `%${digits}%`)
      : request.ilike("name", `%${term.data}%`);
  const { data } = await request;
  return (data ?? []) as CustomerOption[];
}

export interface CustomerPackageOption {
  id: string;
  name: string;
  serviceId: string;
  sessionsLeft: number;
}

/** Packages with sessions left, to use one in a manual booking (Prompt 27). */
export async function getCustomerPackagesAction(
  customerId: string,
): Promise<CustomerPackageOption[]> {
  await requireAgenda();
  const supabase = await createClient();
  const { data } = await supabase
    .from("customer_packages")
    .select("id, sessions_left, package:packages(name, service_id)")
    .eq("customer_id", z.uuid().parse(customerId))
    .gt("sessions_left", 0);
  return (data ?? []).map((row) => {
    const pack = row.package as unknown as { name: string; service_id: string };
    return {
      id: row.id as string,
      name: pack.name,
      serviceId: pack.service_id,
      sessionsLeft: row.sessions_left as number,
    };
  });
}

const manualSchema = selectionSchema.extend({
  professionalId: z.uuid(),
  startsAt: z.iso.datetime({ offset: true }),
  customerId: z.uuid().nullable().default(null),
  newCustomer: z
    .object({
      name: z.string().trim().min(2, "Informe o nome").max(120),
      phone: z.string(),
      email: z.preprocess((v) => (v === "" ? null : v), z.email().nullable()),
    })
    .nullable()
    .default(null),
  customerPackageId: z.uuid().nullable().default(null),
});

export type ManualResult = { ok: true } | { ok: false; message: string };

export async function createManualAppointmentAction(input: unknown): Promise<ManualResult> {
  const context = await requireAgenda();
  const parsed = manualSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]!.message };
  const data = parsed.data;
  if (!allowedProfessional(context, data.professionalId))
    return { ok: false, message: "Sem permissão." };

  let customer: Parameters<typeof createBooking>[0]["customer"];
  if (data.customerId) {
    customer = { existingId: data.customerId };
  } else if (data.newCustomer) {
    const phone = normalizeBrPhone(data.newCustomer.phone);
    if (!phone) return { ok: false, message: "WhatsApp da cliente inválido." };
    customer = {
      name: data.newCustomer.name,
      phone,
      email: data.newCustomer.email,
      marketingOptIn: false,
    };
  } else {
    return { ok: false, message: "Escolha ou cadastre a cliente." };
  }

  const catalog = await loadCatalog(context.business.id);
  if (!catalog) return { ok: false, message: "Negócio não encontrado." };
  const result = await createBooking({
    catalog,
    selection: { serviceIds: data.serviceIds, comboId: data.comboId },
    professional: data.professionalId,
    startsAt: data.startsAt,
    customer,
    source: "manual",
    customerPackageId: data.customerPackageId,
  });
  if (!result.ok) {
    const messages = {
      conflict: "Esse horário não está mais livre. Escolha outro.",
      invalid: "Confira os serviços escolhidos.",
      blocked: "Cliente bloqueada.",
      unavailable: "Horário indisponível.",
      coupon_invalid: "Cupom inválido.",
    } as const;
    return { ok: false, message: messages[result.error] };
  }
  await notifyBookingCreated(result.booking.id);
  refresh(context);
  return { ok: true };
}

const opSchema = z.object({
  id: z.uuid(),
  op: z.enum(["cancel", "complete", "no_show", "approve", "refuse", "confirm_deposit"]),
  reason: z.string().trim().max(200).optional(),
});

export async function appointmentAction(
  input: unknown,
): Promise<{ ok: boolean; message?: string }> {
  const context = await requireAgenda();
  const { id, op, reason } = opSchema.parse(input);
  await assertAppointment(context, id);
  const done = await {
    cancel: () => cancelAppointment(id, "business", reason),
    refuse: () => cancelAppointment(id, "business", reason ?? "Horário não disponível"),
    complete: () => completeAppointment(id),
    no_show: () => markNoShow(id),
    approve: () => approveAppointment(id),
    confirm_deposit: () => confirmDeposit(id),
  }[op]();
  refresh(context);
  return done ? { ok: true } : { ok: false, message: "Não foi possível alterar esse agendamento." };
}

const rescheduleSchema = z.object({
  id: z.uuid(),
  startsAt: z.iso.datetime({ offset: true }),
  professionalId: z.uuid().optional(),
});

export async function rescheduleAction(input: unknown): Promise<{ ok: boolean; message?: string }> {
  const context = await requireAgenda();
  const parsed = rescheduleSchema.parse(input);
  await assertAppointment(context, parsed.id);
  if (parsed.professionalId && !allowedProfessional(context, parsed.professionalId)) {
    return { ok: false, message: "Sem permissão." };
  }
  const result = await rescheduleAppointment(
    parsed.id,
    parsed.startsAt,
    "business",
    parsed.professionalId,
  );
  refresh(context);
  if (result.ok) return { ok: true };
  return {
    ok: false,
    message:
      result.error === "conflict" ? "Esse horário não está livre." : "Não foi possível remarcar.",
  };
}

const blockSchema = z.object({
  professionalId: z.uuid(),
  date: z.iso.date(),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().trim().max(200).optional(),
});

export async function blockTimeAction(input: unknown): Promise<{ ok: boolean; message?: string }> {
  const context = await requireAgenda();
  const parsed = blockSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Confira os horários." };
  const { professionalId, date, start, end, reason } = parsed.data;
  if (!allowedProfessional(context, professionalId))
    return { ok: false, message: "Sem permissão." };
  const startsAt = localToUtc(date, start, context.business.timezone);
  const endsAt = localToUtc(date, end, context.business.timezone);
  if (endsAt <= startsAt) return { ok: false, message: "O fim precisa ser depois do início." };
  const supabase = await createClient();
  const { error } = await supabase.from("time_off").insert({
    business_id: context.business.id,
    professional_id: professionalId,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    reason: reason || null,
  });
  if (error) return { ok: false, message: "Não foi possível bloquear." };
  refresh(context);
  return { ok: true };
}

export async function deleteBlockAction(id: string): Promise<{ ok: boolean }> {
  const context = await requireAgenda();
  const supabase = await createClient();
  // RLS limits staff to their own professional's blocks.
  const { error } = await supabase
    .from("time_off")
    .delete()
    .eq("id", z.uuid().parse(id))
    .eq("business_id", context.business.id);
  refresh(context);
  return { ok: !error };
}
