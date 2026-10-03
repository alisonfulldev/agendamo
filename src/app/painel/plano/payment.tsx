"use client";

import { Check, Copy, CreditCard, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { FieldShell } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import type { PixCharge } from "@/lib/billing/service";
import { formatBRL } from "@/lib/money";

import { changePaymentMethodAction, pendingPixAction, subscriptionStatusAction } from "./actions";

export type PaymentMethod = "pix" | "credit_card";

export interface CardFormValue {
  holderName: string;
  number: string;
  expiry: string;
  ccv: string;
  postalCode: string;
  addressNumber: string;
  phone: string;
}

export const EMPTY_CARD: CardFormValue = {
  holderName: "",
  number: "",
  expiry: "",
  ccv: "",
  postalCode: "",
  addressNumber: "",
  phone: "",
};

/** Pix or card. */
export function MethodSwitch({
  value,
  onChange,
}: {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
}) {
  return (
    <div role="group" aria-label="Forma de pagamento" className="grid grid-cols-2 gap-2">
      {(
        [
          ["pix", "Pix", "Na hora, com QR code", QrCode],
          ["credit_card", "Cartão de crédito", "Renova sozinho todo mês", CreditCard],
        ] as const
      ).map(([method, label, hint, Icon]) => (
        <button
          key={method}
          type="button"
          aria-pressed={value === method}
          onClick={() => onChange(method)}
          className={`flex items-center gap-3 rounded-xl border p-3 text-left ${value === method ? "border-primary ring-2 ring-primary" : ""}`}
        >
          <Icon className="size-5 shrink-0 text-primary" aria-hidden />
          <span>
            <span className="block font-medium">{label}</span>
            <span className="block text-xs text-muted-foreground">{hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

const maskNumber = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
const maskExpiry = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};
const maskCep = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};
const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
};

/** Card data (sent once to our server, which passes it to Asaas and keeps only the last digits). */
export function CardFields({
  value,
  onChange,
}: {
  value: CardFormValue;
  onChange: (value: CardFormValue) => void;
}) {
  const set = (key: keyof CardFormValue, v: string) => onChange({ ...value, [key]: v });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <FieldShell name="card-number" label="Número do cartão">
        <Input
          id="card-number"
          inputMode="numeric"
          autoComplete="cc-number"
          value={value.number}
          onChange={(e) => set("number", maskNumber(e.target.value))}
          className="h-10"
        />
      </FieldShell>
      <FieldShell name="card-holder" label="Nome impresso no cartão">
        <Input
          id="card-holder"
          autoComplete="cc-name"
          value={value.holderName}
          onChange={(e) => set("holderName", e.target.value.toUpperCase())}
          className="h-10"
        />
      </FieldShell>
      <div className="grid grid-cols-2 gap-3">
        <FieldShell name="card-expiry" label="Validade (MM/AA)">
          <Input
            id="card-expiry"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA"
            value={value.expiry}
            onChange={(e) => set("expiry", maskExpiry(e.target.value))}
            className="h-10"
          />
        </FieldShell>
        <FieldShell name="card-ccv" label="Código (CVV)">
          <Input
            id="card-ccv"
            inputMode="numeric"
            autoComplete="cc-csc"
            value={value.ccv}
            onChange={(e) => set("ccv", e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="h-10"
          />
        </FieldShell>
      </div>
      <FieldShell name="card-phone" label="Telefone com DDD">
        <Input
          id="card-phone"
          inputMode="tel"
          autoComplete="tel"
          value={value.phone}
          onChange={(e) => set("phone", maskPhone(e.target.value))}
          className="h-10"
        />
      </FieldShell>
      <FieldShell name="card-cep" label="CEP da fatura do cartão">
        <Input
          id="card-cep"
          inputMode="numeric"
          autoComplete="postal-code"
          value={value.postalCode}
          onChange={(e) => set("postalCode", maskCep(e.target.value))}
          className="h-10"
        />
      </FieldShell>
      <FieldShell name="card-address-number" label="Número do endereço">
        <Input
          id="card-address-number"
          value={value.addressNumber}
          onChange={(e) => set("addressNumber", e.target.value.slice(0, 10))}
          className="h-10"
        />
      </FieldShell>
      <p className="text-xs text-muted-foreground sm:col-span-2">
        Pagamento processado com segurança pelo Asaas. Não guardamos os dados do seu cartão, só os 4
        últimos dígitos.
      </p>
    </div>
  );
}

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
        <p className="text-muted-foreground">Sua assinatura está ativa.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-5 text-center">
      <p className="font-semibold">Pague {formatBRL(pix.valueCents)} com Pix</p>
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

/** After a card payment: waiting for the confirmation from Asaas. */
export function CardProcessing() {
  const active = useWaitForActivation(true);
  return active ? (
    <div
      role="status"
      className="flex flex-col items-center gap-2 rounded-2xl border bg-card p-6 text-center"
    >
      <Check className="size-10 text-primary" aria-hidden />
      <p className="text-xl font-bold">Pagamento confirmado! 🎉</p>
      <p className="text-muted-foreground">Sua assinatura está ativa.</p>
    </div>
  ) : (
    <p className="flex items-center gap-2 rounded-xl border bg-card p-4 text-sm" aria-live="polite">
      <span className="size-2 animate-pulse rounded-full bg-primary" />
      Confirmando o pagamento com o cartão… esta tela atualiza sozinha.
    </p>
  );
}

/** "Pagar com Pix" for an open charge (first payment, renewal or overdue). */
export function PendingPixButton({ label }: { label: string }) {
  const [pix, setPix] = useState<PixCharge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  if (pix) return <PixPanel pix={pix} />;
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
          else setError("Não há cobrança em aberto agora.");
        }}
        className="flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        <QrCode className="size-4" /> {loading ? "Gerando Pix…" : label}
      </button>
      {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}
    </div>
  );
}

/** Current payment method of an active subscription, with "Trocar forma de pagamento". */
export function PaymentMethodSection({
  method,
  cardLabel,
}: {
  method: PaymentMethod;
  cardLabel: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [next, setNext] = useState<PaymentMethod>(method === "pix" ? "credit_card" : "pix");
  const [card, setCard] = useState<CardFormValue>(EMPTY_CARD);
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        Forma de pagamento:{" "}
        <span className="font-medium">
          {method === "pix" ? "Pix (você paga pelo QR code a cada mensalidade)" : cardLabel}
        </span>
      </p>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="self-start text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Trocar forma de pagamento
        </button>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border p-4">
          <MethodSwitch value={next} onChange={setNext} />
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldShell name="method-name" label="Nome ou razão social">
              <Input
                id="method-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10"
              />
            </FieldShell>
            <FieldShell name="method-document" label="CPF ou CNPJ">
              <Input
                id="method-document"
                inputMode="numeric"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                className="h-10"
              />
            </FieldShell>
          </div>
          {next === "credit_card" ? <CardFields value={card} onChange={setCard} /> : null}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={async () => {
                setPending(true);
                const result = await changePaymentMethodAction({
                  name,
                  cpfCnpj: document,
                  paymentMethod: next,
                  card: next === "credit_card" ? card : undefined,
                });
                setPending(false);
                setMessage({ ok: result.ok, text: result.message });
                if (result.ok) {
                  setOpen(false);
                  router.refresh();
                }
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Salvando…" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2 text-sm hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
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
