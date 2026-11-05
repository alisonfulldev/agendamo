"use client";

import { useState, useTransition } from "react";

import { customSiteStepAction } from "@/app/admin/sales-actions";
import { Button } from "@/components/ui/button";

/** Delivered / finished / cancelled. */
export function OrderButton({
  id,
  step,
  label,
  variant = "default",
}: {
  id: string;
  step: "deliver" | "finish" | "cancel";
  label: string;
  variant?: "default" | "outline" | "ghost";
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant={variant}
        disabled={pending}
        onClick={() =>
          startTransition(async () => setMessage((await customSiteStepAction(id, step)).message))
        }
      >
        {pending ? "Aguarde…" : label}
      </Button>
      {message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}
    </div>
  );
}
