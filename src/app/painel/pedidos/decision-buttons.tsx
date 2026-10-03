"use client";

import { Check, X } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { confirmRequestAction, declineRequestAction } from "./actions";

/** "Confirmar horário" turns the request into an appointment; "Recusar" discards it. */
export function DecisionButtons({ id, when }: { id: string; when: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await confirmRequestAction(id);
              setMessage(result.ok ? null : result.message);
            })
          }
        >
          <Check /> {pending ? "Confirmando…" : `Confirmar ${when}`}
        </Button>
        {asking ? (
          <Button
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await declineRequestAction(id);
                setMessage(result.ok ? null : result.message);
                setAsking(false);
              })
            }
          >
            Sim, recusar
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => setAsking(true)}>
            <X /> Recusar
          </Button>
        )}
      </div>
      {message ? (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  );
}
