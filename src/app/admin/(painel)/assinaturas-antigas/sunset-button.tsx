"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { sunsetSubscriptionAction } from "./actions";

/** Two steps (no browser dialog): "Encerrar no vencimento" → "Confirmar". */
export function SunsetButton({ businessId }: { businessId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  if (message) return <span className="text-sm text-muted-foreground">{message}</span>;
  return confirming ? (
    <span className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await sunsetSubscriptionAction(businessId);
            setMessage(result.message);
          })
        }
      >
        Confirmar
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>
        Voltar
      </Button>
    </span>
  ) : (
    <Button type="button" size="sm" variant="outline" onClick={() => setConfirming(true)}>
      Encerrar no vencimento
    </Button>
  );
}
