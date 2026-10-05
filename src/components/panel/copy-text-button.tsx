"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

/** Copies a ready text (e.g. free times for the WhatsApp status) to the clipboard. */
export function CopyTextButton({
  text,
  label = "Copiar texto",
  variant = "outline",
}: {
  text: string;
  label?: string;
  variant?: "outline" | "default";
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant={variant}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check /> : <Copy />} {copied ? "Copiado" : label}
    </Button>
  );
}
