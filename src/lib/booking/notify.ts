import "server-only";

import QRCode from "qrcode";

import type { EmailAttachment } from "@/lib/email/send";
import { sendEmail } from "@/lib/email/send";
import type { EmailContent } from "@/lib/email/layout";
import { buildIcs } from "@/lib/ics";
import { getPlanFeatures } from "@/lib/plans";
import { claimNotification, notifyTeam } from "@/lib/notifications/owner";
import { formatBrPhone, whatsappLink } from "@/lib/phone";
import { buildPixBrCode } from "@/lib/pix";
import { syncAppointmentToGoogle } from "@/lib/google/sync";

import {
  formatDateLong,
  formatTime,
  loadAppointmentDetails,
  manageUrl,
  priceText,
  serviceEnd,
  serviceNames,
  totalPrice,
  type AppointmentDetails,
} from "./details";

function when(d: AppointmentDetails) {
  return `${formatDateLong(d.appointment.starts_at, d.business.timezone)} às ${formatTime(d.appointment.starts_at, d.business.timezone)}`;
}

function detailLines(d: AppointmentDetails) {
  return [
    { label: "Serviço", value: serviceNames(d) },
    ...(d.showProfessional ? [{ label: "Com", value: d.professional.name }] : []),
    { label: "Quando", value: when(d) },
    { label: "Valor", value: `R$ ${priceText(totalPrice(d))}` },
    ...(d.page?.address
      ? [
          {
            label: "Onde",
            value: [d.page.address, d.page.neighborhood, d.page.city].filter(Boolean).join(", "),
          },
        ]
      : []),
  ];
}

function icsAttachment(
  d: AppointmentDetails,
  status: "CONFIRMED" | "CANCELLED" = "CONFIRMED",
): EmailAttachment {
  return {
    filename: "agendamento.ics",
    contentType: "text/calendar; charset=utf-8",
    content: Buffer.from(
      buildIcs({
        uid: `${d.appointment.id}@lively`,
        start: new Date(d.appointment.starts_at),
        end: serviceEnd(d),
        title: `${serviceNames(d)} · ${d.business.name}`,
        location: d.page?.address
          ? [d.page.address, d.page.neighborhood, d.page.city].filter(Boolean).join(", ")
          : undefined,
        description: `Remarcar ou cancelar: ${manageUrl(d)}`,
        status,
        sequence: status === "CANCELLED" ? 1 : 0,
      }),
    ),
  };
}

/** Pix BR Code for the deposit (paid straight to the professional, rule 11). */
export function depositBrCode(d: AppointmentDetails): string | null {
  if (!d.page?.pix_key || d.appointment.deposit_cents <= 0) return null;
  return buildPixBrCode({
    key: d.page.pix_key,
    receiverName: d.page.pix_receiver_name ?? d.business.name,
    city: d.page.pix_city ?? d.page.city ?? "Brasil",
    amountCents: d.appointment.deposit_cents,
    txid: d.appointment.deposit_reference ?? `MC${d.appointment.id.replace(/-/g, "").slice(0, 20)}`,
    description: `Sinal ${d.business.name}`,
  });
}

async function sendToCustomer(
  d: AppointmentDetails,
  subject: string,
  content: EmailContent,
  attachments?: EmailAttachment[],
) {
  if (!d.customer.email) return;
  await sendEmail({ brand: d.brand, to: d.customer.email, subject, content, attachments }).catch(
    (error) => console.error("customer email failed", error),
  );
}

/** New appointment: customer confirmation (by status) + e-mail/push to the team. */
export async function notifyBookingCreated(appointmentId: string): Promise<void> {
  const d = await loadAppointmentDetails(appointmentId);
  if (!d) return;
  const first = d.customer.name.split(" ")[0];
  const manage = { label: "Remarcar ou cancelar", url: manageUrl(d) };

  if (d.appointment.status === "confirmed") {
    await sendToCustomer(
      d,
      `Horário confirmado: ${serviceNames(d)} · ${d.business.name}`,
      {
        heading: `Prontinho, ${first}!`,
        paragraphs: [
          "Seu horário está confirmado. O arquivo anexo adiciona o compromisso na agenda do celular.",
        ],
        details: detailLines(d),
        secondaryLinks: [manage],
      },
      [icsAttachment(d)],
    );
  } else if (d.appointment.status === "pending") {
    await sendToCustomer(d, `Recebemos seu pedido · ${d.business.name}`, {
      heading: "Pedido recebido",
      paragraphs: [
        `${d.business.name} vai confirmar seu horário e você recebe o aviso por e-mail.`,
      ],
      details: detailLines(d),
      secondaryLinks: [{ label: "Cancelar pedido", url: manageUrl(d) }],
    });
  } else if (d.appointment.status === "awaiting_deposit") {
    const code = depositBrCode(d);
    const deadline = d.appointment.deposit_expires_at
      ? `${formatTime(d.appointment.deposit_expires_at, d.business.timezone)} de ${formatDateLong(d.appointment.deposit_expires_at, d.business.timezone)}`
      : "";
    const attachments: EmailAttachment[] = [];
    if (code)
      attachments.push({
        filename: "pix.png",
        contentType: "image/png",
        content: await QRCode.toBuffer(code, { width: 512, margin: 2 }),
      });
    await sendToCustomer(
      d,
      `Falta o Pix para garantir seu horário · ${d.business.name}`,
      {
        heading: "Garanta seu horário",
        paragraphs: [
          `Faça o Pix de R$ ${priceText(d.appointment.deposit_cents)} (o valor exato, com os centavos) até ${deadline}. Sem o comprovante, o horário é liberado.`,
          ...(code ? ["Pix copia e cola:", code] : []),
          `O Pix vai direto para ${d.business.name}. Depois de pagar, envie o comprovante na página do agendamento: o horário fica pré-confirmado até a conferência.`,
        ],
        details: detailLines(d),
        cta: { label: "Enviar comprovante", url: manageUrl(d) },
      },
      attachments,
    );
  }

  await notifyTeam({
    businessId: d.business.id,
    type: "appointment_new",
    professionalId: d.professional.id,
    subject: `${d.appointment.status === "pending" ? "Agendamento para aprovar" : "Novo agendamento"}: ${d.customer.name}`,
    content: {
      heading:
        d.appointment.status === "pending"
          ? "Agendamento aguardando sua aprovação"
          : "Novo agendamento",
      paragraphs: [
        `${d.customer.name} agendou ${d.appointment.source === "chat" ? "pela sua página" : "pelo painel"}.`,
      ],
      details: [
        ...detailLines(d),
        ...(d.customer.phone
          ? [{ label: "WhatsApp", value: formatBrPhone(d.customer.phone) }]
          : []),
        ...(d.appointment.status === "awaiting_deposit"
          ? [{ label: "Sinal", value: `R$ ${priceText(d.appointment.deposit_cents)} (aguardando)` }]
          : []),
      ],
      cta: { label: "Abrir agenda", url: "/painel/agenda" },
    },
    push: {
      title: d.appointment.status === "pending" ? "Agendamento para aprovar" : "Novo agendamento",
      body: `${d.customer.name} · ${serviceNames(d)} · ${when(d)}`,
      url: "/painel/agenda",
    },
  });

  await syncAppointmentToGoogle(appointmentId).catch((error) =>
    console.error("google sync failed", error),
  );
}

/** Pending approved or deposit confirmed: tell the customer it is confirmed. */
export async function notifyBookingConfirmed(appointmentId: string): Promise<void> {
  const d = await loadAppointmentDetails(appointmentId);
  if (!d) return;
  await sendToCustomer(
    d,
    `Horário confirmado: ${serviceNames(d)} · ${d.business.name}`,
    {
      heading: "Seu horário está confirmado!",
      paragraphs: [`${d.business.name} confirmou seu horário.`],
      details: detailLines(d),
      secondaryLinks: [{ label: "Remarcar ou cancelar", url: manageUrl(d) }],
    },
    [icsAttachment(d)],
  );
}

/** Cancellation by the customer or the business. */
export async function notifyBookingCancelled(
  appointmentId: string,
  by: "customer" | "business",
  reason?: string,
): Promise<void> {
  const d = await loadAppointmentDetails(appointmentId);
  if (!d) return;
  if (by === "business") {
    await sendToCustomer(
      d,
      `Horário cancelado · ${d.business.name}`,
      {
        heading: "Seu horário foi cancelado",
        paragraphs: [
          `${d.business.name} precisou cancelar seu horário.${reason ? ` Motivo: ${reason}` : ""}`,
          "Se quiser, escolha outro horário na página.",
        ],
        details: detailLines(d),
      },
      [icsAttachment(d, "CANCELLED")],
    );
  } else {
    await sendToCustomer(d, `Cancelamento confirmado · ${d.business.name}`, {
      heading: "Cancelamento confirmado",
      paragraphs: ["Seu horário foi cancelado. Esperamos ver você em breve!"],
      details: detailLines(d),
    });
  }
  await notifyTeam({
    businessId: d.business.id,
    type: "appointment_changed",
    professionalId: d.professional.id,
    subject: `Cancelado: ${d.customer.name}, ${when(d)}`,
    content: {
      heading: "Agendamento cancelado",
      paragraphs: [
        `${d.customer.name} ${by === "customer" ? "cancelou" : "teve o horário cancelado"}. O horário já está livre de novo.`,
      ],
      details: detailLines(d),
      cta: { label: "Abrir agenda", url: "/painel/agenda" },
    },
    push: {
      title: "Agendamento cancelado",
      body: `${d.customer.name} · ${when(d)}`,
      url: "/painel/agenda",
    },
  });
  await syncAppointmentToGoogle(appointmentId).catch((error) =>
    console.error("google sync failed", error),
  );
}

/**
 * After the business reschedules: how the customer hears about it. The e-mail goes automatically
 * (when there is one); the WhatsApp message is ready for the owner to send with one tap.
 */
export async function rescheduleNoticeForBusiness(
  appointmentId: string,
): Promise<{ emailed: boolean; whatsappUrl: string | null }> {
  const d = await loadAppointmentDetails(appointmentId);
  if (!d) return { emailed: false, whatsappUrl: null };
  const firstName = d.customer.name.split(" ")[0];
  const text = `Olá, ${firstName}! Aqui é ${d.business.name}. Seu horário de ${serviceNames(d)} foi remarcado para ${when(d)}. Se precisar mudar, é só usar este link: ${manageUrl(d)}`;
  return {
    emailed: Boolean(d.customer.email),
    whatsappUrl: d.customer.phone ? whatsappLink(d.customer.phone, text) : null,
  };
}

/** Reschedule by the customer or the business. */
export async function notifyBookingRescheduled(
  appointmentId: string,
  by: "customer" | "business",
  previousStartsAt: string,
): Promise<void> {
  const d = await loadAppointmentDetails(appointmentId);
  if (!d) return;
  const before = `${formatDateLong(previousStartsAt, d.business.timezone)} às ${formatTime(previousStartsAt, d.business.timezone)}`;
  await sendToCustomer(
    d,
    `Horário remarcado: ${when(d)} · ${d.business.name}`,
    {
      heading: "Horário remarcado",
      paragraphs: [`Seu horário mudou de ${before} para ${when(d)}.`],
      details: detailLines(d),
      secondaryLinks: [{ label: "Remarcar ou cancelar", url: manageUrl(d) }],
    },
    [icsAttachment(d)],
  );
  await notifyTeam({
    businessId: d.business.id,
    type: "appointment_changed",
    professionalId: d.professional.id,
    subject: `Remarcado: ${d.customer.name}, agora ${when(d)}`,
    content: {
      heading: "Agendamento remarcado",
      paragraphs: [
        `${by === "customer" ? `${d.customer.name} remarcou` : "O horário foi remarcado"}: de ${before} para ${when(d)}.`,
      ],
      details: detailLines(d),
      cta: { label: "Abrir agenda", url: "/painel/agenda" },
    },
    push: {
      title: "Agendamento remarcado",
      body: `${d.customer.name} · agora ${when(d)}`,
      url: "/painel/agenda",
    },
  });
  await syncAppointmentToGoogle(appointmentId).catch((error) =>
    console.error("google sync failed", error),
  );
}

/** 24h reminder, once per appointment (notification_log). */
export async function sendReminder(appointmentId: string): Promise<boolean> {
  const d = await loadAppointmentDetails(appointmentId);
  if (!d || d.appointment.status !== "confirmed" || !d.customer.email) return false;
  // Reminders are part of Agenda and Pro (not Grátis).
  if (!getPlanFeatures(d.business).reminders) return false;
  if (!(await claimNotification(d.business.id, "reminder_24h", d.appointment.id))) return false;
  await sendToCustomer(d, `Lembrete: ${serviceNames(d)} amanhã · ${d.business.name}`, {
    heading: `Até amanhã, ${d.customer.name.split(" ")[0]}!`,
    paragraphs: [
      "Passando para lembrar do seu horário.",
      "Se não puder vir, remarque em poucos toques: o horário fica livre para outra pessoa.",
    ],
    details: detailLines(d),
    cta: { label: "Preciso remarcar", url: manageUrl(d, { reschedule: true }) },
    secondaryLinks: [{ label: "Cancelar horário", url: manageUrl(d) }],
  });
  return true;
}

/** "{cliente} enviou comprovante de R$ {valor} para {serviço} em {data} às {hora}. Confira no seu banco." */
function receiptLine(d: AppointmentDetails): string {
  return `${d.customer.name.split(" ")[0]} enviou comprovante de R$ ${priceText(d.appointment.deposit_cents)} para ${serviceNames(d)} em ${formatDateLong(d.appointment.starts_at, d.business.timezone)} às ${formatTime(d.appointment.starts_at, d.business.timezone)}. Confira no seu banco.`;
}

/** A valid receipt arrived: e-mail and push to the team (the time stays pre-confirmed). */
export async function notifyReceiptReceived(appointmentId: string): Promise<void> {
  const d = await loadAppointmentDetails(appointmentId);
  if (!d) return;
  await notifyTeam({
    businessId: d.business.id,
    type: "deposit_informed",
    professionalId: d.professional.id,
    subject: `Comprovante de R$ ${priceText(d.appointment.deposit_cents)} para conferir`,
    content: {
      heading: "Chegou um comprovante",
      paragraphs: [
        receiptLine(d),
        "O horário fica pré-confirmado até você conferir. Confirme o recebimento ou marque “Não recebi” no painel.",
      ],
      details: detailLines(d),
      cta: { label: "Conferir comprovante", url: "/painel/sinais" },
    },
    push: { title: "Comprovante para conferir", body: receiptLine(d), url: "/painel/sinais" },
  });
}

/** Still not checked after N hours: reminder to the team (once per N). */
export async function notifyReceiptReminder(appointmentId: string, hours: number): Promise<boolean> {
  const d = await loadAppointmentDetails(appointmentId);
  if (!d || d.appointment.deposit_status !== "sent") return false;
  if (!(await claimNotification(d.business.id, `deposit_reminder_${hours}h`, d.appointment.id)))
    return false;
  await notifyTeam({
    businessId: d.business.id,
    type: "deposit_informed",
    professionalId: d.professional.id,
    subject: `Comprovante esperando conferência há ${hours} horas`,
    content: {
      heading: "Tem um comprovante esperando você",
      paragraphs: [
        receiptLine(d),
        "Enquanto você não confere, o horário continua pré-confirmado e bloqueado.",
      ],
      cta: { label: "Conferir agora", url: "/painel/sinais" },
    },
    push: {
      title: "Comprovante esperando conferência",
      body: receiptLine(d),
      url: "/painel/sinais",
    },
  });
  return true;
}
