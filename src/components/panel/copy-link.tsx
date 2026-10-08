"use client";

import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { QR_PNG_DOWNLOAD_URL } from "@/lib/qr";

/** Page URL with copy and QR download buttons. */
export function CopyLink({ url, qr = true }: { url: string; qr?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="max-w-full truncate text-sm font-medium text-primary"
      >
        {url}
      </a>
      <Button
        type="button"
        size="sm"
        variant="outline"
        data-tour="link-copy"
        onClick={async () => {
          await navigator.clipboard.writeText(url).catch(() => undefined);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? <Check /> : <Copy />} {copied ? "Copiado" : "Copiar link"}
      </Button>
      {qr ? (
        <Button asChild size="sm" variant="outline">
          <a href={QR_PNG_DOWNLOAD_URL} download>
            <Download /> QR code
          </a>
        </Button>
      ) : null}
    </div>
  );
}
