import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";

import { getCurrentBrand } from "@/brands/server";
import { brandUrl } from "@/brands/urls";
import {
  formatDateLong,
  formatTime,
  loadAppointmentDetails,
  priceText,
  serviceNames,
  totalPrice,
} from "@/lib/booking/details";
import { depositBrCode } from "@/lib/booking/notify";
import { whatsappLink } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";

import { canChange } from "./actions";
import { ManagePanel } from "./manage-panel";

export const metadata: Metadata = { title: "Seu agendamento", robots: { index: false } };

const STATUS_TEXT = {
  confirmed: "Confirmado",
  pending: "Aguardando confirmação",
  awaiting_deposit: "Aguardando o sinal",
  cancelled: "Cancelado",
  completed: "Concluído",
  no_show: "Não compareceu",
} as const;

export default async function ManageAppointmentPage({
  params,
  searchParams,
}: PageProps<"/cancelar/[token]">) {
  const { token } = await params;
  const reschedule = (await searchParams).remarcar === "1";
  if (!/^[0-9a-f]{32}$/.test(token)) notFound();
  const { data } = await createAdminClient()
    .from("appointments")
    .select("id")
    .eq("cancel_token", token)
    .maybeSingle();
  const details = data ? await loadAppointmentDetails(data.id as string) : null;
  if (!details) notFound();

  // Always on the business's brand domain.
  const domainBrand = await getCurrentBrand();
  if (domainBrand.key !== details.brand.key)
    redirect(brandUrl(details.brand, `/cancelar/${token}${reschedule ? "?remarcar=1" : ""}`));

  const { appointment, business, page } = details;
  const changeable = await canChange(appointment, business.min_notice_minutes);
  const code = appointment.status === "awaiting_deposit" ? depositBrCode(details) : null;
  const pix = code ? { code, qr: await QRCode.toDataURL(code, { width: 320, margin: 1 }) } : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-10">
      <div>
        <p className="text-sm text-muted-foreground">{business.name}</p>
        <h1 className="text-2xl font-bold">Seu agendamento</h1>
      </div>
      <dl className="grid grid-cols-[6rem_1fr] gap-y-2 rounded-xl border bg-card p-4 text-sm">
        <dt className="text-muted-foreground">Status</dt>
        <dd className="font-medium">{STATUS_TEXT[appointment.status]}</dd>
        <dt className="text-muted-foreground">Serviço</dt>
        <dd>{serviceNames(details)}</dd>
        {details.showProfessional ? (
          <>
            <dt className="text-muted-foreground">Com</dt>
            <dd>{details.professional.name}</dd>
          </>
        ) : null}
        <dt className="text-muted-foreground">Quando</dt>
        <dd className="capitalize">
          {formatDateLong(appointment.starts_at, business.timezone)} às{" "}
          {formatTime(appointment.starts_at, business.timezone)}
        </dd>
        <dt className="text-muted-foreground">Valor</dt>
        <dd>R$ {priceText(totalPrice(details))}</dd>
        {appointment.deposit_cents > 0 ? (
          <>
            <dt className="text-muted-foreground">Sinal</dt>
            <dd>R$ {priceText(appointment.deposit_cents)}</dd>
          </>
        ) : null}
      </dl>

      <ManagePanel
        token={token}
        canChange={changeable}
        startRescheduling={reschedule}
        deposit={
          pix &&
          appointment.status === "awaiting_deposit" &&
          appointment.deposit_status === "waiting" &&
          appointment.deposit_expires_at
            ? {
                amount: priceText(appointment.deposit_cents),
                pix,
                expiresAt: appointment.deposit_expires_at,
                businessName: business.name,
                whatsapp: page?.whatsapp_number ?? null,
              }
            : null
        }
      />

      {!changeable && ["confirmed", "pending", "awaiting_deposit"].includes(appointment.status) ? (
        <p className="text-sm text-muted-foreground">
          Faltando menos de {Math.round(business.min_notice_minutes / 60) || 1}h, remarcações e
          cancelamentos são feitos direto com {business.name}
          {page?.whatsapp_number ? (
            <>
              {" "}
              pelo{" "}
              <a
                href={whatsappLink(page.whatsapp_number)}
                className="text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </>
          ) : null}
          .
        </p>
      ) : null}
    </main>
  );
}
