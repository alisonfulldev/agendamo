"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { decideDepositAction, registerRefundAction } from "./actions";

/** [Confirmar recebimento] / [Não recebi] (with the reason). Never automatic. */
export function DepositDecision({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [refusing, setRefusing] = useState(false);
  const [reason, setReason] = useState("");
  const decide = (decision: "confirm" | "refuse") =>
    startTransition(async () => {
      await decideDepositAction({ appointmentId, decision, reason: reason || undefined });
      router.refresh();
    });
  if (refusing) {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor={`reason-${appointmentId}`}>
          Motivo (fica registrado)
        </label>
        <Input
          id={`reason-${appointmentId}`}
          value={reason}
          maxLength={300}
          placeholder="Ex.: o Pix não apareceu no extrato"
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => decide("refuse")}
          >
            Não recebi: liberar o horário
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => setRefusing(false)}
          >
            Voltar
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" disabled={pending} onClick={() => decide("confirm")}>
        Confirmar recebimento
      </Button>
      <Button type="button" variant="outline" disabled={pending} onClick={() => setRefusing(true)}>
        Não recebi
      </Button>
    </div>
  );
}

/** "Registrar devolução": the deposit was returned outside MeetChat (date and amount). */
export function RefundForm({
  appointmentId,
  defaultAmount,
}: {
  appointmentId: string;
  defaultAmount: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(defaultAmount);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  if (!open)
    return (
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Registrar devolução
      </Button>
    );
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-sm">
        Valor devolvido (R$)
        <Input
          value={amount}
          inputMode="decimal"
          onChange={(e) => setAmount(e.target.value)}
          className="w-32"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Data
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-40"
        />
      </label>
      <Button
        type="button"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await registerRefundAction({ appointmentId, amount, date });
            setMessage(result.message ?? null);
            if (result.ok) router.refresh();
          })
        }
      >
        Salvar
      </Button>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </div>
  );
}
