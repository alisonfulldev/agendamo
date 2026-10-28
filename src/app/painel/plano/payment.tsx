"use client";

import { Check, Copy, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { PixCharge } from "@/lib/billing/service";
import { formatBRL } from "@/lib/money";

import { pendingPixAction, subscriptionStatusAction } from "./actions";

/**
 * Waits for the payment confirmation (the Asaas webhook updates the subscription) and refreshes
 * the panel once it is active.
 */
export function useWaitForActivation(waiting: boolean): boolean {
  const router = useRouter();
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!waiting || active) return;
    const timer = setInterval(async () => {
      const status = await subscriptionStatusAction().catch(() => null);
      if (status === "active") {
        setActive(true);
        clearInterval(timer);
        router.refresh();
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [waiting, active, router]);
  return active;
}

/** QR code + "copia e cola" inside the panel, waiting for the payment. */
export function PixPanel({ pix, waitForPlan = true }: { pix: PixCharge; waitForPlan?: boolean }) {
  const [copied, setCopied] = useState(false);
  const active = useWaitForActivation(waitForPlan);
  if (active) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-2 rounded-2xl border bg-card p-6 text-center"
      >
        <Check className="size-10 text-primary" aria-hidden />
        <p className="text-xl font-bold">Pagamento confirmado! 🎉</p>
        <p className="text-muted-foreground">
          {pix.automatic
            ? "Sua assinatura está ativa. As próximas mensalidades serão debitadas pelo Pix Automático."
            : "Sua assinatura está ativa."}
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-5 text-center">
      <p className="font-semibold">Pague {formatBRL(pix.valueCents)} com Pix</p>
      {pix.automatic ? (
        <p className="max-w-sm text-sm text-muted-foreground">
          No app do banco, pague e confirme o <strong>Pix Automático</strong>: as próximas
          mensalidades são debitadas sozinhas, sem precisar lembrar. Você pode cancelar quando
          quiser pelo próprio banco.
        </p>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- QR code returned as a data URL */}
      <img src={pix.image} alt="QR code do Pix" width={220} height={220} className="rounded-lg" />
      <code className="w-full rounded-lg bg-muted p-2 text-xs break-all">{pix.payload}</code>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(pix.payload);
          setCopied(true);
        }}
        className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-primary hover:bg-muted"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Copiado!" : "Copiar Pix copia e cola"}
      </button>
      {waitForPlan ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
          <span className="size-2 animate-pulse rounded-full bg-primary" />
          Aguardando o pagamento… esta tela atualiza sozinha.
        </p>
      ) : null}
    </div>
  );
}

/** "Pagar com Pix" for an open charge (renewal or overdue). */
export function PendingPixButton({ label }: { label: string }) {
  const [pix, setPix] = useState<PixCharge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // A renewal keeps the plan active: wait for the payment only on the paid-again screen.
  if (pix) return <PixPanel pix={pix} waitForPlan={false} />;
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          const charge = await pendingPixAction().catch(() => null);
          setLoading(false);
          if (charge) setPix(charge);
          else setError("Não foi possível gerar o Pix agora. Tente de novo em instantes.");
        }}
        className="flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        <QrCode className="size-4" /> {loading ? "Gerando Pix…" : label}
      </button>
      {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}
    </div>
  );
}
