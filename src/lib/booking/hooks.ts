import "server-only";

import { formatInTimeZone } from "date-fns-tz";

import { brandUrl } from "@/brands/urls";
import { sendEmail } from "@/lib/email/send";
import { claimNotification, notifyTeam } from "@/lib/notifications/owner";
import { getPlanFeatures } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

import { formatDateLong, loadAppointmentDetails } from "./details";

/** Completing an appointment: package session, review request, referral validation. */
export async function onAppointmentCompleted(appointmentId: string): Promise<void> {
  const d = await loadAppointmentDetails(appointmentId);
  if (!d) return;
  const admin = createAdminClient();
  const features = getPlanFeatures(d.business);

  // Prompt 27: one session less from the customer's package; warn when 1 is left.
  if (
    d.appointment.package_id &&
    (await claimNotification(d.business.id, "package_session", d.appointment.id))
  ) {
    const { data: pack } = await admin
      .from("customer_packages")
      .select("id, sessions_left, package:packages(name)")
      .eq("id", d.appointment.package_id)
      .maybeSingle();
    if (pack && (pack.sessions_left as number) > 0) {
      const left = (pack.sessions_left as number) - 1;
      await admin.from("customer_packages").update({ sessions_left: left }).eq("id", pack.id);
      if (left === 1) {
        const name = (pack.package as unknown as { name: string } | null)?.name ?? "pacote";
        await notifyTeam({
          businessId: d.business.id,
          type: "appointment_changed",
          subject: `${d.customer.name}: resta 1 sessão do ${name}`,
          content: {
            heading: "Resta 1 sessão no pacote",
            paragraphs: [
              `${d.customer.name} tem só mais 1 sessão do ${name}. Que tal oferecer a renovação?`,
            ],
            cta: { label: "Ver cliente", url: `/painel/clientes/${d.customer.id}` },
          },
          push: {
            title: "Resta 1 sessão no pacote",
            body: `${d.customer.name} · ${name}`,
            url: `/painel/clientes/${d.customer.id}`,
          },
        });
        if (d.customer.email) {
          await sendEmail({
            brand: d.brand,
            to: d.customer.email,
            subject: `Resta 1 sessão do seu ${name} · ${d.business.name}`,
            content: {
              heading: "Resta 1 sessão no seu pacote",
              paragraphs: [`Você tem mais 1 sessão do ${name} com ${d.business.name}.`],
              cta: { label: "Agendar", url: brandUrl(d.brand, `/${d.business.slug}`) },
            },
          }).catch((e) => console.error(e));
        }
      }
    }
  }

  // Prompt 32: the referred customer's first completed appointment validates the referral.
  const { data: referral } = await admin
    .from("referrals")
    .select("id, referrer_customer_id")
    .eq("referred_customer_id", d.customer.id)
    .eq("status", "pending")
    .maybeSingle();
  if (referral) {
    await admin
      .from("referrals")
      .update({ status: "valid", appointment_id: d.appointment.id })
      .eq("id", referral.id);
    const { data: referrerRow } = await admin
      .from("customers")
      .select("name")
      .eq("id", referral.referrer_customer_id)
      .maybeSingle();
    const referrer = (referrerRow?.name as string | undefined) ?? "Uma cliente";
    await notifyTeam({
      businessId: d.business.id,
      type: "appointment_new",
      subject: `Indicação válida: ${referrer} indicou ${d.customer.name}`,
      content: {
        heading: "Nova indicação válida",
        paragraphs: [
          `${d.customer.name} concluiu o primeiro atendimento por indicação de ${referrer}. Aplique a recompensa combinada.`,
        ],
        cta: { label: "Ver indicações", url: "/painel/vendas/indicacoes" },
      },
      push: {
        title: "Indicação válida",
        body: `${referrer} indicou ${d.customer.name}`,
        url: "/painel/vendas/indicacoes",
      },
    });
  }

  // Prompt 29: verified review request (single-use link).
  if (d.customer.email && features.salesTools) {
    const { data: token } = await admin
      .from("review_tokens")
      .upsert(
        { business_id: d.business.id, appointment_id: d.appointment.id },
        { onConflict: "appointment_id", ignoreDuplicates: true },
      )
      .select("token")
      .maybeSingle();
    const reviewToken = token?.token as string | undefined;
    if (
      reviewToken &&
      (await claimNotification(d.business.id, "review_request", d.appointment.id))
    ) {
      await sendEmail({
        brand: d.brand,
        to: d.customer.email,
        subject: `Como foi seu atendimento em ${d.business.name}?`,
        content: {
          heading: `Obrigada pela visita, ${d.customer.name.split(" ")[0]}!`,
          paragraphs: ["Conta pra gente como foi? Leva menos de um minuto e ajuda muito."],
          cta: { label: "Avaliar atendimento", url: brandUrl(d.brand, `/avaliar/${reviewToken}`) },
          secondaryLinks: [
            {
              label: "Indicar uma amiga",
              url: brandUrl(d.brand, `/${d.business.slug}?ref=${d.customer.referral_code}`),
            },
          ],
        },
      }).catch((e) => console.error(e));
    }
  }
}

/** Prompt 28: a freed slot goes to the waitlist of that day and service, once per cancellation. */
export async function onAppointmentCancelled(appointmentId: string): Promise<void> {
  await notifyWaitlistOfFreedSlot(appointmentId, null);
}

/** A rescheduled appointment frees its old time: the waitlist of that day hears about it too. */
export async function onAppointmentRescheduled(
  appointmentId: string,
  previousStartsAt: string,
): Promise<void> {
  await notifyWaitlistOfFreedSlot(appointmentId, previousStartsAt);
}

/**
 * Notifies the waitlist of the day and services of a freed slot: the appointment's own time when
 * cancelled, or its previous time when rescheduled. Once per freed slot (notification_log).
 */
async function notifyWaitlistOfFreedSlot(
  appointmentId: string,
  previousStartsAt: string | null,
): Promise<void> {
  const d = await loadAppointmentDetails(appointmentId);
  if (!d) return;
  const freedStartsAt = previousStartsAt ?? d.appointment.starts_at;
  if (new Date(freedStartsAt) <= new Date()) return;
  const claimed = previousStartsAt
    ? await claimNotification(
        d.business.id,
        "waitlist_reschedule",
        `${d.appointment.id}:${freedStartsAt}`,
      )
    : await claimNotification(d.business.id, "waitlist_cancel", d.appointment.id);
  if (!claimed) return;

  const admin = createAdminClient();
  const date = formatInTimeZone(new Date(freedStartsAt), d.business.timezone, "yyyy-MM-dd");
  const { data: services } = await admin
    .from("appointment_services")
    .select("service_id")
    .eq("appointment_id", appointmentId);
  const serviceIds = (services ?? []).map((s) => s.service_id).filter(Boolean) as string[];
  if (serviceIds.length === 0) return;

  const { data: entries } = await admin
    .from("waitlist_entries")
    .select("*")
    .eq("business_id", d.business.id)
    .eq("date", date)
    .eq("status", "waiting")
    .in("service_id", serviceIds)
    .order("created_at", { ascending: true });

  for (const entry of entries ?? []) {
    if (entry.email) {
      const url = brandUrl(
        d.brand,
        `/${d.business.slug}?agendar=1&servico=${entry.service_id}&data=${date}`,
      );
      await sendEmail({
        brand: d.brand,
        to: entry.email as string,
        subject: `Abriu um horário em ${formatDateLong(freedStartsAt, d.business.timezone)} · ${d.business.name}`,
        content: {
          heading: "Abriu um horário!",
          paragraphs: [
            `Você está na lista de espera de ${d.business.name} e acabou de abrir um horário no dia que você queria.`,
            "Quem confirmar primeiro leva.",
          ],
          cta: { label: "Agendar agora", url },
        },
      }).catch((e) => console.error(e));
    }
    await admin
      .from("waitlist_entries")
      .update({ status: "notified", notified_at: new Date().toISOString() })
      .eq("id", entry.id);
  }
}
