"use client";

import { CircleCheck, Copy, FileUp, LifeBuoy, Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  confirmReceiptAction,
  declarePaidAction,
  signReceiptAction,
} from "@/app/[slug]/receipt-actions";
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
  receipt_required: "Para este agendamento, envie o comprovante do Pix.",
};

function errorText(failure: unknown, businessName: string): string {
  const message =
    failure instanceof ReceiptFileError
      ? failure.message
      : (ERRORS[failure instanceof Error ? failure.message : "invalid"] ?? ERRORS.invalid!);
  return message.replace("{business}", businessName);
}

/** Uploads a receipt: compressed in the browser, sent straight to storage, checked on the server. */
async function uploadReceipt(token: string, file: File): Promise<void> {
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
}

/**
 * "Anexar comprovante": the button opens the photo gallery (where the bank app's screenshot is);
 * a PDF goes through the small link. `primary` when the receipt is required.
 */
export function ReceiptAttach({
  token,
  businessName,
  primary,
  label,
  onSent,
}: {
  token: string;
  businessName: string;
  primary: boolean;
  label: string;
  onSent: () => void;
}) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  async function send(file: File) {
    setError(null);
    setSending(true);
    try {
      await uploadReceipt(token, file);
      onSent();
    } catch (failure) {
      setError(errorText(failure, businessName));
    } finally {
      setSending(false);
    }
  }

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void send(file);
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={sending}
        onClick={() => imageRef.current?.click()}
        className={
          primary
            ? "flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-60"
            : "flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-medium text-primary underline-offset-4 hover:underline disabled:opacity-60"
        }
      >
        <FileUp className="size-4" aria-hidden />
        {sending ? "Enviando comprovante…" : label}
      </button>
      <button
        type="button"
        disabled={sending}
        onClick={() => pdfRef.current?.click()}
        className="self-center text-xs text-muted-foreground underline underline-offset-4"
      >
        O comprovante é um PDF? Enviar PDF
      </button>
      <input
        ref={imageRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Comprovante do Pix"
        onChange={pick}
      />
      <input
        ref={pdfRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        aria-label="Comprovante em PDF"
        onChange={pick}
      />
      {error ? (
        <p role="alert" className="px-1 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function mmss(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Deposit / full payment by Pix. Shows the Pix (copy and paste + QR) and the reservation
 * countdown. "Já fiz o Pix" is the main action (the receipt is optional): the time stays reserved,
 * never confirmed, until the owner finds the unique-cents amount in the bank. A customer marked
 * "Não recebi" before must attach the receipt instead.
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
  const [state, setState] = useState<"waiting" | "declaring" | "declared" | "sent">("waiting");
  const [receiptRequired, setReceiptRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const left = new Date(expiresAt).getTime() - now;
  const done = state === "declared" || state === "sent";
  const expired = !done && left <= 0;

  useEffect(() => {
    if (done || expired) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [done, expired]);

  async function declare() {
    setError(null);
    setState("declaring");
    const result = await declarePaidAction({ token }).catch(() => ({
      ok: false as const,
      error: "invalid" as const,
    }));
    if (result.ok) {
      setState("declared");
      return;
    }
    setState("waiting");
    if (result.error === "receipt_required") setReceiptRequired(true);
    if (result.error === "expired") setNow(Date.now() + left);
    setError(errorText(new Error(result.error), businessName));
  }

  if (state === "sent") {
    return (
      <p role="status" className="rounded-2xl bg-card px-4 py-3 text-card-foreground shadow-sm">
        Recebemos seu comprovante! Seu horário está pré-confirmado. Você recebe a confirmação assim
        que {businessName} conferir.
      </p>
    );
  }

  if (state === "declared") {
    return (
      <div className="flex flex-col gap-2">
        <p role="status" className="rounded-2xl bg-card px-4 py-3 text-card-foreground shadow-sm">
          Pronto! Avisamos {businessName}. Seu horário fica reservado e você recebe a confirmação
          assim que o Pix for conferido.
        </p>
        <ReceiptAttach
          token={token}
          businessName={businessName}
          primary={false}
          label="Quer agilizar? Anexar comprovante (opcional)"
          onSent={() => setState("sent")}
        />
      </div>
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
      {receiptRequired ? (
        <ReceiptAttach
          token={token}
          businessName={businessName}
          primary
          label="Enviar comprovante"
          onSent={() => setState("sent")}
        />
      ) : (
        <>
          <button
            type="button"
            disabled={state === "declaring"}
            onClick={() => void declare()}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-60"
          >
            <CircleCheck className="size-4" aria-hidden />
            {state === "declaring" ? "Avisando…" : "Já fiz o Pix"}
          </button>
          <ReceiptAttach
            token={token}
            businessName={businessName}
            primary={false}
            label="Anexar comprovante (opcional)"
            onSent={() => setState("sent")}
          />
        </>
      )}
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
