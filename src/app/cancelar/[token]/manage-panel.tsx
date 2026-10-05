"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import {
  cancelByTokenAction,
  informDepositAction,
  rescheduleByTokenAction,
  rescheduleDaysAction,
  rescheduleSlotsAction,
} from "./actions";

export function ManagePanel({
  token,
  canChange,
  awaitingDeposit,
  depositInformed,
  pix,
  startRescheduling = false,
}: {
  token: string;
  canChange: boolean;
  /** Opened from the reminder's "Preciso remarcar": go straight to the new times. */
  startRescheduling?: boolean;
  awaitingDeposit: boolean;
  depositInformed: boolean;
  pix: { code: string; qr: string } | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "cancel" | "reschedule">(
    startRescheduling && canChange ? "reschedule" : "idle",
  );
  const [days, setDays] = useState<{ date: string; label: string }[] | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<{
    key: string;
    list: { startsAt: string; time: string }[];
  } | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (mode !== "reschedule" || days !== null) return;
    rescheduleDaysAction(token, null).then(setDays);
  }, [mode, days, token]);

  useEffect(() => {
    if (!date) return;
    rescheduleSlotsAction(token, date).then((list) => setSlots({ key: date, list }));
  }, [date, token]);

  const currentSlots = slots?.key === date ? slots.list : null;

  return (
    <div className="flex flex-col gap-4">
      {awaitingDeposit && pix ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4">
          <p className="font-medium">Pix do sinal</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- generated QR (data URL) */}
          <img src={pix.qr} alt="QR code do Pix" width={220} height={220} />
          <code className="w-full break-all rounded-lg bg-muted p-2 text-xs">{pix.code}</code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigator.clipboard.writeText(pix.code)}
          >
            Copiar Pix copia e cola
          </Button>
          {depositInformed ? (
            <p className="text-sm text-muted-foreground">
              Você já avisou que pagou. Aguarde a confirmação.
            </p>
          ) : (
            <Button
              type="button"
              className="h-11"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await informDepositAction(token);
                  setMessage(
                    result.ok
                      ? {
                          ok: true,
                          text: "Avisamos que você pagou. Você recebe a confirmação por e-mail.",
                        }
                      : { ok: false, text: "Não foi possível avisar." },
                  );
                  router.refresh();
                })
              }
            >
              Já paguei
            </Button>
          )}
        </div>
      ) : null}

      {canChange ? (
        mode === "idle" ? (
          <div className="flex flex-col gap-2">
            <Button type="button" className="h-11" onClick={() => setMode("reschedule")}>
              Remarcar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => setMode("cancel")}
            >
              Cancelar horário
            </Button>
          </div>
        ) : mode === "cancel" ? (
          <div className="flex flex-col gap-2">
            <p>Tem certeza que quer cancelar?</p>
            <Button
              type="button"
              variant="destructive"
              className="h-11"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await cancelByTokenAction(token);
                  setMessage(
                    result.ok
                      ? { ok: true, text: "Horário cancelado." }
                      : { ok: false, text: result.message ?? "Erro" },
                  );
                  setMode("idle");
                  router.refresh();
                })
              }
            >
              Sim, cancelar
            </Button>
            <Button type="button" variant="ghost" onClick={() => setMode("idle")}>
              Voltar
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="font-medium">Escolha o novo dia</p>
            {days === null ? (
              <p className="text-sm text-muted-foreground">Buscando dias livres…</p>
            ) : days.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sem horários livres nos próximos dias.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {days.map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    aria-pressed={date === d.date}
                    onClick={() => setDate(d.date)}
                    className={`rounded-xl border px-3 py-2 text-left capitalize ${date === d.date ? "border-primary bg-accent" : "bg-card"}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}
            {date ? (
              currentSlots === null ? (
                <p className="text-sm text-muted-foreground">Buscando horários…</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {currentSlots.map((slot) => (
                    <button
                      key={slot.startsAt}
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const result = await rescheduleByTokenAction(token, slot.startsAt);
                          if (result.ok) {
                            setMessage({
                              ok: true,
                              text: `Remarcado para ${slot.time}. Enviamos a confirmação por e-mail.`,
                            });
                            setMode("idle");
                            router.refresh();
                          } else {
                            setMessage({ ok: false, text: result.message ?? "Erro" });
                            rescheduleSlotsAction(token, date).then((list) =>
                              setSlots({ key: date, list }),
                            );
                          }
                        })
                      }
                      className="rounded-xl border bg-card px-3 py-2 font-medium"
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )
            ) : null}
            <Button type="button" variant="ghost" onClick={() => setMode("idle")}>
              Voltar
            </Button>
          </div>
        )
      ) : null}

      {message ? (
        <p
          role={message.ok ? "status" : "alert"}
          className={`rounded-lg px-3 py-2 text-sm ${message.ok ? "bg-accent text-accent-foreground" : "bg-destructive/10 text-destructive"}`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
