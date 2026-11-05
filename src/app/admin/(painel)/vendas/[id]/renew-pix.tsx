"use client";

import { useState, useTransition } from "react";

import { renewSalePixAction } from "@/app/admin/sales-actions";
import { Button } from "@/components/ui/button";

/** "Gerar novo Pix" when the previous one expired. */
export function RenewPixButton({ saleId }: { saleId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => setMessage((await renewSalePixAction(saleId)).message))
        }
      >
        {pending ? "Gerando…" : "Gerar novo Pix"}
      </Button>
      {message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}
    </div>
  );
}
