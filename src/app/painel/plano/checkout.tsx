"use client";

import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { FieldShell } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBRL } from "@/lib/money";
import { subscriptionPrice, yearlySavings, type Cycle } from "@/lib/plans";

import {
  addonAction,
  cancelAddonAction,
  cancelPlanAction,
  checkoutAction,
  previewPlatformCouponAction,
} from "./actions";

const FEATURES = [
  "Chat de agendamento: a cliente escolhe o horário e já fica agendada",
  "Agenda, lembretes e confirmações automáticas",
  "Financeiro: receitas, custos e lucro do mês",
  "Sinal por Pix, combos, pacotes, cupons e ferramentas de venda",
  "Google Agenda e botão de agendamento no seu site",
  "Equipe: cada profissional com a própria agenda",
];

function PayerFields({
  name,
  setName,
  document,
  setDocument,
}: {
  name: string;
  setName: (v: string) => void;
  document: string;
  setDocument: (v: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <FieldShell name="payer-name" label="Nome ou razão social (para a nota)">
        <Input
          id="payer-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-10"
        />
      </FieldShell>
      <FieldShell name="payer-document" label="CPF ou CNPJ">
        <Input
          id="payer-document"
          inputMode="numeric"
          value={document}
          onChange={(e) => setDocument(e.target.value)}
          className="h-10"
        />
      </FieldShell>
    </div>
  );
}

export function PlanCheckout({
  initialCycle,
  initialExtras,
  activeProfessionals,
  hasActiveSubscription,
  addonPrices,
}: {
  initialCycle: Cycle;
  initialExtras: number;
  /** Active professionals today (suggested number of seats). */
  activeProfessionals: number;
  hasActiveSubscription: boolean;
  addonPrices: { featured: number; customDomain: number };
}) {
  const router = useRouter();
  const [cycle, setCycle] = useState<Cycle>(initialCycle);
  const [professionals, setProfessionals] = useState(
    Math.max(initialExtras + 1, hasActiveSubscription ? 1 : activeProfessionals, 1),
  );
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState<number | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [addon, setAddon] = useState<"featured" | "custom_domain" | null>(null);
  const [city, setCity] = useState("");

  const extras = professionals - 1;
  const total = subscriptionPrice(cycle, extras, discount ?? 0);
  const savings = yearlySavings(extras);
  const perExtra = subscriptionPrice(cycle, 1) - subscriptionPrice(cycle, 0);
  const unit = cycle === "monthly" ? "mês" : "ano";
  const unchanged = hasActiveSubscription && cycle === initialCycle && extras === initialExtras;

  const finish = (result: { ok: boolean; message: string; invoiceUrl?: string | null }) => {
    setMessage({ ok: result.ok, text: result.message });
    if (result.ok && result.invoiceUrl) window.location.href = result.invoiceUrl;
    else router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {(["monthly", "yearly"] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={cycle === c}
            onClick={() => setCycle(c)}
            className={`relative flex flex-col gap-1 rounded-2xl border bg-card p-5 text-left ${cycle === c ? "ring-2 ring-primary" : ""}`}
          >
            {c === "yearly" ? (
              <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                Economize {formatBRL(savings)}
              </span>
            ) : null}
            <span className="font-semibold">{c === "monthly" ? "Mensal" : "Anual"}</span>
            <span>
              <span className="font-heading text-3xl font-bold">
                {formatBRL(subscriptionPrice(c, extras))}
              </span>
              <span className="text-muted-foreground">/{c === "monthly" ? "mês" : "ano"}</span>
            </span>
            <span className="text-sm text-muted-foreground">
              {c === "monthly"
                ? "Cancele quando quiser"
                : `Sai ${formatBRL(Math.round(subscriptionPrice("yearly", extras) / 12))}/mês: ${formatBRL(savings)} a menos que no mensal`}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5">
        <div>
          <p className="font-semibold">Profissionais</p>
          <p className="text-sm text-muted-foreground">
            1 incluso. Cada extra: {formatBRL(perExtra)}/{unit}
          </p>
        </div>
        <div
          className="flex items-center gap-2"
          role="group"
          aria-label="Quantidade de profissionais"
        >
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Menos um profissional"
            disabled={professionals <= 1}
            onClick={() => setProfessionals((n) => Math.max(1, n - 1))}
          >
            <Minus />
          </Button>
          <span className="w-8 text-center text-lg font-semibold" aria-live="polite">
            {professionals}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Mais um profissional"
            disabled={professionals >= 50}
            onClick={() => setProfessionals((n) => Math.min(50, n + 1))}
          >
            <Plus />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {FEATURES.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p className="text-lg">
          Total: <span className="font-bold">{formatBRL(total)}</span>
          <span className="text-muted-foreground">/{unit}</span>
          {discount ? (
            <span className="ml-2 text-sm text-primary">({discount}% de desconto do cupom)</span>
          ) : null}
        </p>
        {hasActiveSubscription && professionals < activeProfessionals ? (
          <p className="text-sm text-destructive">
            Você tem {activeProfessionals} profissionais ativos. Os que passarem do novo número
            ficam inativos (nada é apagado).
          </p>
        ) : null}

        {!hasActiveSubscription ? (
          <>
            <PayerFields
              name={name}
              setName={setName}
              document={document}
              setDocument={setDocument}
            />
            <div className="flex flex-wrap items-end gap-2">
              <FieldShell name="coupon" label="Cupom (opcional)">
                <Input
                  id="coupon"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  className="h-10 w-48"
                />
              </FieldShell>
              <Button
                type="button"
                variant="outline"
                disabled={coupon.length < 3}
                onClick={() =>
                  startTransition(async () =>
                    setDiscount(await previewPlatformCouponAction(coupon)),
                  )
                }
              >
                Aplicar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Você vai para a página segura do Asaas para pagar com cartão ou Pix. A assinatura
              ativa assim que o pagamento é confirmado.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            O novo valor vale a partir da próxima cobrança.
          </p>
        )}
        <Button
          type="button"
          className="h-11 self-start"
          disabled={pending || unchanged}
          onClick={() =>
            startTransition(async () => {
              finish(
                await checkoutAction({
                  cycle,
                  extraProfessionals: extras,
                  name,
                  cpfCnpj: document,
                  coupon: discount !== null ? coupon : undefined,
                }),
              );
            })
          }
        >
          {pending
            ? "Processando…"
            : hasActiveSubscription
              ? "Salvar alteração"
              : `Assinar por ${formatBRL(total)}/${unit}`}
        </Button>
      </div>

      {hasActiveSubscription ? (
        <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
          <h3 className="font-semibold">Adicionais</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setAddon("featured")}
              className={`rounded-xl border p-4 text-left ${addon === "featured" ? "ring-2 ring-primary" : ""}`}
            >
              <span className="font-medium">Destaque no portal</span>
              <span className="block text-sm text-muted-foreground">
                {formatBRL(addonPrices.featured)}/mês por cidade. Aparece primeiro nas buscas.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAddon("custom_domain")}
              className={`rounded-xl border p-4 text-left ${addon === "custom_domain" ? "ring-2 ring-primary" : ""}`}
            >
              <span className="font-medium">Domínio próprio</span>
              <span className="block text-sm text-muted-foreground">
                {formatBRL(addonPrices.customDomain)}/mês. Seu chat e seu perfil no seu endereço.
              </span>
            </button>
          </div>
          {addon ? (
            <div className="flex flex-col gap-3">
              {addon === "featured" ? (
                <FieldShell name="addon-city" label="Cidade">
                  <Input
                    id="addon-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-10"
                  />
                </FieldShell>
              ) : null}
              <PayerFields
                name={name}
                setName={setName}
                document={document}
                setDocument={setDocument}
              />
              <Button
                type="button"
                className="self-start"
                disabled={pending}
                onClick={() =>
                  startTransition(async () =>
                    finish(await addonAction({ addon, city, name, cpfCnpj: document })),
                  )
                }
              >
                Contratar
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

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

export function CancelPlanButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="ghost"
        className="self-start"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            if (
              !window.confirm(
                "Cancelar a assinatura? Tudo continua funcionando até o fim do período pago.",
              )
            )
              return;
            const result = await cancelPlanAction();
            setMessage(result.message);
            router.refresh();
          })
        }
      >
        Cancelar assinatura
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}

export function CancelAddonButton({ subscriptionId }: { subscriptionId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          if (!window.confirm("Cancelar este adicional?")) return;
          await cancelAddonAction(subscriptionId);
          router.refresh();
        })
      }
    >
      Cancelar
    </Button>
  );
}
