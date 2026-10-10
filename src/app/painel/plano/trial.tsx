"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { PaidPlan } from "@/lib/db/types";

import { startTrialAction } from "./actions";

/** "Testar 7 dias": Agenda or Pro, once per account (Grátis plan). */
export function TrialStarter() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const start = (plan: PaidPlan) =>
    startTransition(async () => {
      const result = await startTrialAction(plan);
      setMessage({ ok: result.ok, text: result.message });
      if (result.ok) router.refresh();
    });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={pending} onClick={() => start("agenda")}>
          Testar o Agenda por 7 dias
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => start("pro")}>
          Testar o Pro por 7 dias
        </Button>
      </div>
      {message ? (
        <p
          role={message.ok ? "status" : "alert"}
          className={`text-sm ${message.ok ? "text-primary" : "text-destructive"}`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
