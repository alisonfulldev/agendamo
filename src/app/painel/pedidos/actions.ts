"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createBooking } from "@/lib/booking/create";
import { eligibleProfessionals, loadCatalog } from "@/lib/booking/data";
import { formatDateLong, formatTime } from "@/lib/booking/details";
import { approveAppointment } from "@/lib/booking/manage";
import { notifyBookingConfirmed } from "@/lib/booking/notify";
import { requireOwner } from "@/lib/business/context";
import { sendEmail } from "@/lib/email/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  id: z.uuid(),
  status: z.enum(["new", "contacted", "done", "discarded"]),
});

export async function updateRequestStatusAction(
  id: string,
  status: string,
): Promise<{ ok: boolean }> {
  const { business } = await requireOwner();
  const parsed = schema.safeParse({ id, status });
  if (!parsed.success) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase
    .from("booking_requests")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .eq("business_id", business.id);
  revalidatePath("/painel/pedidos");
  return { ok: !error };
}

export type RequestDecision = { ok: true } | { ok: false; message: string };

async function loadOpenRequest(businessId: string, id: string) {
  const { data } = await createAdminClient()
    .from("booking_requests")
    .select("*")
    .eq("id", id)
    .eq("business_id", businessId)
    .in("status", ["new", "contacted"])
    .is("appointment_id", null)
    .maybeSingle();
  return data;
}

/** Owner accepts the time chosen in the request: creates the appointment and tells the customer. */
export async function confirmRequestAction(id: string): Promise<RequestDecision> {
  const { business } = await requireOwner();
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Pedido inválido." };
  const request = await loadOpenRequest(business.id, id);
  if (!request) return { ok: false, message: "Esse pedido já foi resolvido." };
  if (!request.preferred_starts_at || !request.service_id) {
    return { ok: false, message: "Esse pedido não tem horário escolhido. Combine pelo WhatsApp." };
  }

  const catalog = await loadCatalog(business.id);
  const service = catalog?.services.find((s) => s.id === request.service_id);
  if (!catalog || !service)
    return { ok: false, message: "O serviço desse pedido não existe mais." };
  const professional =
    (request.professional_id as string | null) ?? eligibleProfessionals(catalog, [service])[0]?.id;
  if (!professional) return { ok: false, message: "Nenhum profissional faz esse serviço." };

  const result = await createBooking({
    catalog,
    selection: { serviceIds: [service.id], comboId: null },
    professional,
    startsAt: request.preferred_starts_at as string,
    customer: {
      name: request.customer_name as string,
      phone: request.phone as string,
      email: (request.email as string | null) ?? null,
      marketingOptIn: false,
    },
    source: "manual",
  });
  if (!result.ok) {
    return {
      ok: false,
      message:
        result.error === "unavailable" || result.error === "conflict"
          ? "Esse horário não está mais livre. Combine outro com a cliente pelo WhatsApp."
          : result.error === "blocked"
            ? "Essa cliente está bloqueada."
            : "Não foi possível confirmar agora.",
    };
  }

  // The owner already said yes: a "pending" result (manual approval / no-shows) is approved now.
  if (result.booking.status === "pending") await approveAppointment(result.booking.id);
  else await notifyBookingConfirmed(result.booking.id);

  await createAdminClient()
    .from("booking_requests")
    .update({ status: "done", appointment_id: result.booking.id })
    .eq("id", id)
    .eq("business_id", business.id);
  revalidatePath("/painel/pedidos");
  return { ok: true };
}

/** Owner cannot take the request: it is discarded and the customer (if she left an e-mail) is told. */
export async function declineRequestAction(id: string): Promise<RequestDecision> {
  const context = await requireOwner();
  const { business } = context;
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Pedido inválido." };
  const request = await loadOpenRequest(business.id, id);
  if (!request) return { ok: false, message: "Esse pedido já foi resolvido." };

  await createAdminClient()
    .from("booking_requests")
    .update({ status: "discarded" })
    .eq("id", id)
    .eq("business_id", business.id);

  if (request.email && request.preferred_starts_at) {
    const when = `${formatDateLong(request.preferred_starts_at as string, business.timezone)} às ${formatTime(request.preferred_starts_at as string, business.timezone)}`;
    await sendEmail({
      brand: context.brand,
      to: request.email as string,
      subject: `Sobre seu pedido de horário · ${business.name}`,
      content: {
        heading: "Não conseguimos esse horário",
        paragraphs: [
          `${business.name} não conseguiu confirmar o horário de ${when}.`,
          "Escolha outro horário pelo mesmo link ou fale direto pelo WhatsApp.",
        ],
      },
    }).catch((e) => console.error("decline e-mail failed", e));
  }
  revalidatePath("/painel/pedidos");
  return { ok: true };
}
