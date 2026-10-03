"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ComponentProps } from "react";

import { Button } from "@/components/ui/button";

/** Runs a bound Server Action, optionally after a confirmation, then refreshes the page. */
export function ActionButton({
  action,
  confirmText,
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, "onClick" | "action"> & {
  action: () => Promise<unknown>;
  confirmText?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      disabled={pending || props.disabled}
      onClick={() =>
        startTransition(async () => {
          if (confirmText && !window.confirm(confirmText)) return;
          await action();
          router.refresh();
        })
      }
      {...props}
    >
      {children}
    </Button>
  );
}
