"use client";

import { useState, useTransition } from "react";

import { HEARD_FROM, type HeardFrom } from "@/lib/signup-origin";

import { saveHeardFromAction } from "./heard-from-actions";

/**
 * Optional "Como conheceu o MeetChat?" on the sign-up success screens (conversation and form).
 * One tap saves it; nothing blocks the way into the panel.
 */
export function HeardFromChips({ className = "" }: { className?: string }) {
  const [chosen, setChosen] = useState<HeardFrom | null>(null);
  const [pending, startTransition] = useTransition();

  if (chosen) {
    return (
      <p className={`text-center text-sm text-muted-foreground ${className}`} role="status">
        Obrigado por contar!
      </p>
    );
  }

  return (
    <fieldset className={`flex flex-col items-center gap-2 ${className}`} disabled={pending}>
      <legend className="mb-2 w-full text-center text-sm text-muted-foreground">
        Como conheceu o MeetChat? (opcional)
      </legend>
      <div className="flex flex-wrap justify-center gap-2">
        {(Object.entries(HEARD_FROM) as [HeardFrom, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className="min-h-9 rounded-full border bg-card px-3 text-sm text-card-foreground hover:bg-muted disabled:opacity-60"
            onClick={() =>
              startTransition(async () => {
                await saveHeardFromAction(key).catch(() => null);
                setChosen(key);
              })
            }
          >
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
