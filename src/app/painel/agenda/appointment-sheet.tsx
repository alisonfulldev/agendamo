"use client";

import { formatInTimeZone } from "date-fns-tz";
import { MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { formatBRL } from "@/lib/money";
import { formatBrPhone, whatsappLink } from "@/lib/phone";

import { appointmentAction, rescheduleAction } from "./actions";
import { SlotPicker } from "./slot-picker";
import {
  rescheduledText,
  STATUS_LABELS,
  type AgendaAppointment,
  type AgendaCatalog,
} from "./types";

type Op = "cancel" | "complete" | "no_show" | "approve" | "refuse" | "confirm_deposit";

export function AppointmentSheet({
  appointment,
  timezone,
  catalog,
  onClose,
  onDone,
}: {
  appointment: AgendaAppointment | null;
  timezone: string;
  catalog: AgendaCatalog;
  onClose: () => void;
  /** `whatsappUrl`: ready message to tell the customer about a reschedule. */
  onDone: (message: string, whatsappUrl?: string | null) => void;
}) {
  const [mode, setMode] = useState<"view" | "cancel" | "reschedule">("view");
  const [reason, setReason] = useState("");
  const [newStart, setNewStart] = useState<string | null>(null);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setMode("view");
    setReason("");
    setNewStart(null);
    setProfessionalId(null);
    setError(null);
  };

  if (!appointment) return null;
  const a = appointment;
  const past = new Date(a.startsAt) <= new Date();
  const active =
    a.status === "confirmed" || a.status === "pending" || a.status === "awaiting_deposit";
  const run = (op: Op, success: string) =>
    startTransition(async () => {
      const result = await appointmentAction({ id: a.id, op, reason: reason || undefined });
      if (result.ok) {
        reset();
        onDone(success);
      } else setError(result.message ?? "Não foi possível.");
    });

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) {
          reset();
          onClose();
        }
      }}
    >
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{a.customerName}</SheetTitle>
          <SheetDescription>
            {formatInTimeZone(new Date(a.startsAt), timezone, "dd/MM/yyyy")} · {a.timeLabel} ·{" "}
            {STATUS_LABELS[a.status]}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-6">
          <dl className="grid grid-cols-[6rem_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">Serviço</dt>
            <dd>{a.services}</dd>
            {catalog.professionals.length > 1 ? (
              <>
                <dt className="text-muted-foreground">Profissional</dt>
                <dd>{catalog.professionals.find((p) => p.id === a.professionalId)?.name}</dd>
              </>
            ) : null}
            <dt className="text-muted-foreground">Valor</dt>
            <dd>{formatBRL(a.priceCents)}</dd>
            {a.depositCents > 0 ? (
              <>
                <dt className="text-muted-foreground">Sinal</dt>
                <dd>
                  {formatBRL(a.depositCents)} ·{" "}
                  {
                    {
                      waiting: "aguardando pagamento",
                      informed: "cliente diz que pagou",
                      confirmed: "recebido",
                      none: "",
                    }[a.depositStatus]
                  }
                </dd>
              </>
            ) : null}
            <dt className="text-muted-foreground">Origem</dt>
            <dd>{a.source === "chat" ? "Agendado pela cliente" : "Agendado por você"}</dd>
          </dl>

          {a.customerPhone ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <a href={whatsappLink(a.customerPhone)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle /> WhatsApp
                </a>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href={`tel:+${a.customerPhone}`}>
                  <Phone /> {formatBrPhone(a.customerPhone)}
                </a>
              </Button>
            </div>
          ) : null}
          {a.customerId ? (
            <Link
              href={`/painel/clientes/${a.customerId}`}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Ver ficha da cliente
            </Link>
          ) : null}

          {mode === "view" ? (
            <div className="flex flex-col gap-2">
              {a.status === "pending" ? (
                <>
                  <Button
                    disabled={pending}
                    onClick={() => run("approve", "Agendamento aprovado. A cliente foi avisada.")}
                  >
                    Aprovar
                  </Button>
                  <Button variant="outline" disabled={pending} onClick={() => setMode("cancel")}>
                    Recusar
                  </Button>
                </>
              ) : null}
              {a.status === "awaiting_deposit" ? (
                <Button
                  disabled={pending}
                  onClick={() => run("confirm_deposit", "Sinal confirmado. Horário garantido.")}
                >
                  Confirmar sinal recebido
                </Button>
              ) : null}
              {past && a.status === "confirmed" ? (
                <>
                  <Button
                    disabled={pending}
                    onClick={() => run("complete", "Atendimento concluído.")}
                  >
                    Marcar como concluído
                  </Button>
                  <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() => run("no_show", "Falta registrada.")}
                  >
                    Cliente faltou
                  </Button>
                </>
              ) : null}
              {active ? (
                <>
                  <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() => setMode("reschedule")}
                  >
                    Remarcar
                  </Button>
                  {a.status !== "pending" ? (
                    <Button variant="ghost" disabled={pending} onClick={() => setMode("cancel")}>
                      Cancelar agendamento
                    </Button>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : null}

          {mode === "cancel" ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="cancel-reason" className="text-sm font-medium">
                Motivo (vai no e-mail da cliente, opcional)
              </label>
              <Textarea
                id="cancel-reason"
                rows={2}
                maxLength={200}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() =>
                  run(
                    a.status === "pending" ? "refuse" : "cancel",
                    "Agendamento cancelado. O horário voltou a ficar livre.",
                  )
                }
              >
                {a.status === "pending" ? "Recusar agendamento" : "Confirmar cancelamento"}
              </Button>
              <Button variant="ghost" onClick={reset}>
                Voltar
              </Button>
            </div>
          ) : null}

          {mode === "reschedule" ? (
            <div className="flex flex-col gap-3">
              {catalog.professionals.length > 1 ? (
                <select
                  aria-label="Profissional"
                  value={professionalId ?? a.professionalId}
                  onChange={(e) => {
                    setProfessionalId(e.target.value);
                    setNewStart(null);
                  }}
                  className="h-10 rounded-lg border border-input bg-transparent px-2 text-sm"
                >
                  {catalog.professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              ) : null}
              <SlotPicker
                request={{
                  serviceIds: [],
                  comboId: null,
                  professionalId: professionalId ?? a.professionalId,
                  excludeAppointmentId: a.id,
                }}
                value={newStart}
                onChange={setNewStart}
                defaultDate={a.date}
              />
              <Button
                disabled={!newStart || pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await rescheduleAction({
                      id: a.id,
                      startsAt: newStart!,
                      professionalId:
                        professionalId && professionalId !== a.professionalId
                          ? professionalId
                          : undefined,
                    });
                    if (result.ok) {
                      reset();
                      onDone(rescheduledText(result.emailed), result.whatsappUrl);
                    } else setError(result.message);
                  })
                }
              >
                Confirmar novo horário
              </Button>
              <Button variant="ghost" onClick={reset}>
                Voltar
              </Button>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
