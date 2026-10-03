import { ptBR } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/panel/page-header";
import { Button } from "@/components/ui/button";
import { requireOwner } from "@/lib/business/context";
import type { BookingRequest } from "@/lib/db/types";
import { formatBrPhone, whatsappLink } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";

import { DecisionButtons } from "./decision-buttons";
import { StatusSelect } from "./status-select";

export const metadata: Metadata = { title: "Pedidos de horário" };

function isUpcoming(iso: string | null): boolean {
  return Boolean(iso && new Date(iso).getTime() > Date.now());
}

const PERIODS = { morning: "manhã", afternoon: "tarde", evening: "noite" } as const;

export default async function RequestsPage({ searchParams }: PageProps<"/painel/pedidos">) {
  const { business } = await requireOwner();
  const { todos } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("booking_requests")
    .select("*, service:services(name)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (!todos) query = query.in("status", ["new", "contacted", "done"]);
  const { data } = await query;
  // Open requests, plus confirmed ones still ahead (so the WhatsApp confirmation can be sent).
  const requests = (
    (data ?? []) as (BookingRequest & { service: { name: string } | null })[]
  ).filter(
    (r) => todos || r.status !== "done" || (r.appointment_id && isUpcoming(r.preferred_starts_at)),
  );

  return (
    <div>
      <PageHeader
        title="Pedidos de horário"
        description="Pedidos feitos no seu chat (“Pedir horário”). Confirme o horário escolhido pela cliente e ela recebe o aviso."
        actions={
          <Button asChild variant="outline" size="sm">
            <a href={todos ? "/painel/pedidos" : "/painel/pedidos?todos=1"}>
              {todos ? "Só em aberto" : "Ver todos"}
            </a>
          </Button>
        }
      />
      {requests.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          Nenhum pedido {todos ? "" : "em aberto "}ainda. Divulgue seu link de agendamento!
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((request) => {
            // New requests carry an exact free time; older ones only a day / period.
            const preference = request.preferred_starts_at
              ? formatInTimeZone(
                  new Date(request.preferred_starts_at),
                  business.timezone,
                  "EEEE, dd/MM 'às' HH:mm",
                  { locale: ptBR },
                )
              : [
                  request.preferred_date
                    ? request.preferred_date.split("-").reverse().join("/")
                    : null,
                  request.preferred_period ? PERIODS[request.preferred_period] : null,
                ]
                  .filter(Boolean)
                  .join(", ");
            const open =
              (request.status === "new" || request.status === "contacted") &&
              !request.appointment_id;
            const confirmation = request.preferred_starts_at
              ? `Olá, ${request.customer_name.split(" ")[0]}! Seu horário com ${business.name} está confirmado: ${
                  request.service ? `${request.service.name}, ` : ""
                }${formatInTimeZone(new Date(request.preferred_starts_at), business.timezone, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })}. Até lá!`
              : null;
            const reply = `Olá, ${request.customer_name.split(" ")[0]}! Aqui é ${business.name}. Recebi seu pedido de horário${
              request.service ? ` para ${request.service.name}` : ""
            }. Vamos combinar?`;
            return (
              <li key={request.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{request.customer_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.service?.name ?? "Serviço não informado"}
                    </p>
                    {preference ? (
                      <p className="text-sm font-medium capitalize">{preference}</p>
                    ) : null}
                    {request.appointment_id ? (
                      <p className="text-sm font-medium text-primary">
                        Horário confirmado{request.email ? " (cliente avisada por e-mail)" : ""}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      Recebido em{" "}
                      {formatInTimeZone(
                        new Date(request.created_at),
                        business.timezone,
                        "dd/MM 'às' HH:mm",
                      )}
                    </p>
                  </div>
                  <StatusSelect id={request.id} status={request.status} />
                </div>
                {request.message ? (
                  <p className="mt-2 rounded-lg bg-muted p-2 text-sm">{request.message}</p>
                ) : null}
                {open && request.preferred_starts_at ? (
                  <div className="mt-3">
                    <DecisionButtons
                      id={request.id}
                      when={formatInTimeZone(
                        new Date(request.preferred_starts_at),
                        business.timezone,
                        "dd/MM HH:mm",
                      )}
                    />
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {request.appointment_id && confirmation ? (
                    <Button asChild size="sm">
                      <a
                        href={whatsappLink(request.phone, confirmation)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle /> Enviar confirmação pelo WhatsApp
                      </a>
                    </Button>
                  ) : null}
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={whatsappLink(request.phone, reply)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle /> WhatsApp
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a href={`tel:+${request.phone}`}>
                      <Phone /> Ligar {formatBrPhone(request.phone)}
                    </a>
                  </Button>
                  {request.email ? (
                    <Button asChild size="sm" variant="ghost">
                      <a href={`mailto:${request.email}`}>{request.email}</a>
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
