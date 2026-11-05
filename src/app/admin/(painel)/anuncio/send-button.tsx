"use client";

import { useState, useTransition } from "react";

import { sendAnnouncementAction } from "@/app/admin/sales-actions";
import { Button } from "@/components/ui/button";

/** Sends the announcement after a confirmation. */
export function SendAnnouncementButton({ count }: { count: number }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  if (message) {
    return (
      <p role="status" className="font-medium">
        {message}
      </p>
    );
  }
  return confirming ? (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm">Enviar agora para {count} pessoas? Não dá para desfazer.</span>
      <Button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => setMessage((await sendAnnouncementAction()).message))
        }
      >
        {pending ? "Enviando…" : "Sim, enviar"}
      </Button>
      <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
        Cancelar
      </Button>
    </div>
  ) : (
    <Button type="button" size="lg" disabled={count === 0} onClick={() => setConfirming(true)}>
      Enviar para {count} pessoas
    </Button>
  );
}
