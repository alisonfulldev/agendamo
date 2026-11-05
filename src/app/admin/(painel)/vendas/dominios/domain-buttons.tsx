"use client";

import { useState, useTransition } from "react";

import { domainStepAction } from "@/app/admin/sales-actions";
import { Button } from "@/components/ui/button";

/** One step of a sold domain: connect it, check the DNS, or record the renewal. */
export function DomainButton({
  id,
  step,
  label,
  variant = "default",
}: {
  id: string;
  step: "connect" | "check" | "renew";
  label: string;
  variant?: "default" | "outline";
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant={variant}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await domainStepAction(id, step);
            setMessage({ ok: result.ok, text: result.message });
          })
        }
      >
        {pending ? "Aguarde…" : label}
      </Button>
      {message ? (
        <p
          role={message.ok ? "status" : "alert"}
          className={`text-sm ${message.ok ? "text-muted-foreground" : "text-destructive"}`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
