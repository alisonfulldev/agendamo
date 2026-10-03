"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

/** Submit button that disables itself and shows a pending label while the action runs. */
export function SubmitButton({
  children,
  pendingLabel = "Enviando…",
  className,
  ...props
}: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`h-10 ${className ?? ""}`}
      {...props}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
