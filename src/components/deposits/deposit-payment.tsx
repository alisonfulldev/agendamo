"use client";

import { Copy, FileUp, LifeBuoy, Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { confirmReceiptAction, signReceiptAction } from "@/app/[slug]/receipt-actions";
import { prepareReceipt, ReceiptFileError } from "@/lib/deposits/compress-receipt";
import { whatsappLink } from "@/lib/phone";

const ERRORS: Record<string, string> = {
  duplicate: "Esse comprovante já foi usado em outro agendamento.",
  invalid_file:
    "Esse arquivo não parece um comprovante válido. Envie uma foto (JPG ou PNG) ou um PDF.",
  missing: "O envio não terminou. Tente de novo.",
  too_many: "Foram muitas tentativas. Fale com {business} pelo WhatsApp.",
  rate_limited: "Foram muitas tentativas. Espere um pouco ou fale com {business} pelo WhatsApp.",
  not_waiting: "Esse horário não está mais aguardando pagamento.",
  invalid: "Não conseguimos enviar agora. Tente de novo.",
};

function mmss(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Deposit / full payment by Pix with a mandatory receipt. Shows the Pix (copy and paste + QR),
 * the reservation countdown and the three actions. "Já paguei, enviar comprovante" opens the file
 * picker right away: there is no way to only say "já paguei". The time is pre-confirmed only after
 * the server checked a valid file.
 */
export function DepositPayment({
  token,
  amount,
  pix,
  expiresAt,
  businessName,
  whatsapp,
  onExpired,
}: {
  /** The customer's secret link token. */
  token: string;
  /** "29,93" (with the unique cents). */
  amount: string;
  pix: { code: string; qr: string };
  expiresAt: string;
  businessName: string;
  whatsapp: string | null;
  /** "Escolher outro horário" after the reservation expired. */
  onExpired?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [state, setState] = useState<"waiting" | "sending" | "sent">("waiting");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const left = new Date(expiresAt).getTime() - now;
  const expired = state !== "sent" && left <= 0;

  useEffect(() => {
    if (state === "sent" || expired) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [state, expired]);

  async function send(file: File) {
    setError(null);
    setState("sending");
    try {
      const prepared = await prepareReceipt(file);
      const signed = await signReceiptAction({
        token,
        contentType: prepared.contentType,
        size: prepared.blob.size,
      });
      if (!signed.ok) throw new Error(signed.error);
      const put = await fetch(signed.url, {
        method: "PUT",
        body: prepared.blob,
        headers: { "Content-Type": prepared.contentType, "Cache-Control": "private, no-store" },
      });
      if (!put.ok) throw new Error("missing");
      const confirmed = await confirmReceiptAction({ token, receiptId: signed.receiptId });
      if (!confirmed.ok) throw new Error(confirmed.error);
      setState("sent");
    } catch (failure) {
      setState("waiting");
      const message =
        failure instanceof ReceiptFileError
          ? failure.message
          : (ERRORS[failure instanceof Error ? failure.message : "invalid"] ?? ERRORS.invalid!);
      setError(message.replace("{business}", businessName));
      if (failure instanceof Error && failure.message === "expired") setNow(Date.now() + left);
    }
  }

  if (state === "sent") {
    return (
      <p role="status" className="rounded-2xl bg-card px-4 py-3 text-card-foreground shadow-sm">
        Recebemos seu comprovante! Seu horário está pré-confirmado. Você recebe a confirmação assim
        que {businessName} conferir.
      </p>
    );
  }

  if (expired) {
    return (
      <div className="flex flex-col gap-2">
        <p role="status" className="rounded-2xl bg-card px-4 py-3 text-card-foreground shadow-sm">
          Seu horário expirou. Quer escolher outro?
        </p>
        {onExpired ? (
          <button
            type="button"
            onClick={onExpired}
            className="h-12 rounded-xl bg-primary font-semibold text-primary-foreground"
          >
            Escolher outro horário
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2" data-testid="deposit-payment">
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-card px-4 py-3 text-card-foreground shadow-sm">
        <p className="text-center">
          Para garantir seu horário, faça o Pix de <strong>R$ {amount}</strong>.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element -- generated Pix QR (data URL) */}
        <img src={pix.qr} alt="QR code do Pix" width={220} height={220} />
        <code className="w-full rounded-md bg-muted p-2 text-xs break-all">{pix.code}</code>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground" aria-live="polite">
          <Timer className="size-4" aria-hidden />
          Horário reservado por <strong className="tabular-nums">{mmss(left)}</strong>
        </p>
      </div>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(pix.code).catch(() => undefined);
          setCopied(true);
        }}
        className="flex h-12 items-center justify-center gap-2 rounded-xl border bg-card font-medium"
      >
        <Copy className="size-4" aria-hidden /> {copied ? "Código copiado!" : "Copiar código Pix"}
      </button>
      <button
        type="button"
        disabled={state === "sending"}
        onClick={() => inputRef.current?.click()}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-60"
      >
        <FileUp className="size-4" aria-hidden />
        {state === "sending" ? "Enviando comprovante…" : "Já paguei, enviar comprovante"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="sr-only"
        aria-label="Comprovante do Pix"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void send(file);
        }}
      />
      {whatsapp ? (
        <a
          href={whatsappLink(
            whatsapp,
            `Olá, ${businessName}! Preciso de ajuda com o Pix do meu agendamento.`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 items-center justify-center gap-2 rounded-xl border bg-card font-medium text-primary"
        >
          <LifeBuoy className="size-4" aria-hidden /> Preciso de ajuda
        </a>
      ) : null}
      {error ? (
        <p role="alert" className="px-1 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
