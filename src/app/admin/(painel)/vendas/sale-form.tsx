"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createSaleAction, domainAvailabilityAction } from "@/app/admin/sales-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Option {
  value: string;
  label: string;
}

/** Admin › Vendas › Nova venda: what the customer sent in the WhatsApp chat. */
export function SaleForm({
  niches,
  prices,
  domainPrice,
  customSitePrice,
}: {
  niches: Option[];
  /** Price labels of each plan and cycle ("R$ 49,00/mês"…). */
  prices: Record<"site" | "complete", Record<"monthly" | "yearly", string>>;
  /** "R$ 91,00/ano" */
  domainPrice: string;
  /** "R$ 148,00" */
  customSitePrice: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tier, setTier] = useState<"site" | "complete">("site");
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [withDomain, setWithDomain] = useState(false);
  const [customSite, setCustomSite] = useState(false);
  const [domain, setDomain] = useState("");
  const [availability, setAvailability] = useState<string | null>(null);
  const [checking, startCheck] = useTransition();

  const AVAILABILITY = {
    available: "Disponível ✓",
    taken: "Já tem dono: escolha outro",
    unknown: "Não deu para consultar agora: confira no registro.br",
    invalid: "Domínio inválido. Ex.: studiobela.com.br",
  } as const;

  function submit(form: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createSaleAction({
        businessName: form.get("businessName"),
        nicheKey: form.get("nicheKey"),
        payerName: form.get("payerName"),
        email: form.get("email"),
        whatsapp: form.get("whatsapp"),
        cpfCnpj: form.get("cpfCnpj"),
        tier,
        cycle,
        template: form.get("template") ?? "vibrant",
        couponCode: form.get("couponCode"),
        domain: withDomain ? domain : "",
        customSite: tier === "site" && customSite,
      });
      if (result.ok) router.push(`/admin/vendas/${result.saleId}`);
      else setError(result.message);
    });
  }

  const field = "flex flex-col gap-1.5";
  return (
    <form action={submit} className="grid gap-4 sm:grid-cols-2">
      <div className={field}>
        <Label htmlFor="businessName">Nome do negócio</Label>
        <Input id="businessName" name="businessName" required maxLength={80} />
      </div>
      <div className={field}>
        <Label htmlFor="nicheKey">Ramo</Label>
        <select
          id="nicheKey"
          name="nicheKey"
          required
          defaultValue="beauty"
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          {niches.map((n) => (
            <option key={n.value} value={n.value}>
              {n.label}
            </option>
          ))}
        </select>
      </div>
      <div className={field}>
        <Label htmlFor="payerName">Nome completo (ou razão social)</Label>
        <Input id="payerName" name="payerName" required maxLength={120} />
      </div>
      <div className={field}>
        <Label htmlFor="cpfCnpj">CPF ou CNPJ</Label>
        <Input id="cpfCnpj" name="cpfCnpj" required inputMode="numeric" maxLength={20} />
      </div>
      <div className={field}>
        <Label htmlFor="email">E-mail (vira o login)</Label>
        <Input id="email" name="email" type="email" required maxLength={254} />
      </div>
      <div className={field}>
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input id="whatsapp" name="whatsapp" inputMode="tel" maxLength={30} />
      </div>

      <fieldset className="flex flex-col gap-2 sm:col-span-2">
        <legend className="mb-1 text-sm font-medium">Plano</legend>
        <div className="flex flex-wrap gap-2">
          {(["site", "complete"] as const).map((t) => (
            <Button
              key={t}
              type="button"
              variant={tier === t ? "default" : "outline"}
              aria-pressed={tier === t}
              onClick={() => setTier(t)}
            >
              {t === "site" ? "Site + Agenda" : "Completo (só agenda)"} · {prices[t][cycle]}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(["monthly", "yearly"] as const).map((c) => (
            <Button
              key={c}
              type="button"
              size="sm"
              variant={cycle === c ? "secondary" : "ghost"}
              aria-pressed={cycle === c}
              onClick={() => setCycle(c)}
            >
              {c === "monthly" ? "Mensal" : "Anual"}
            </Button>
          ))}
        </div>
      </fieldset>

      {tier === "site" ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Modelo do site</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="template" value="vibrant" defaultChecked /> Vibrante
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="template" value="elegant" /> Elegante
          </label>
        </fieldset>
      ) : null}
      {tier === "site" ? (
        <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
          <input
            type="checkbox"
            checked={customSite}
            onChange={(e) => setCustomSite(e.target.checked)}
          />
          Site personalizado (+{customSitePrice} no primeiro Pix; o cliente responde o briefing no
          painel)
        </label>
      ) : null}
      <fieldset className="flex flex-col gap-2 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={withDomain}
            onChange={(e) => setWithDomain(e.target.checked)}
          />
          Domínio próprio .com.br (+{domainPrice}, 1º ano no primeiro Pix)
        </label>
        {withDomain ? (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              aria-label="Domínio"
              placeholder="studiobela.com.br"
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                setAvailability(null);
              }}
              className="max-w-xs"
            />
            <Button
              type="button"
              variant="outline"
              disabled={checking || !domain}
              onClick={() =>
                startCheck(async () => {
                  const result = await domainAvailabilityAction(domain);
                  if (result.domain) setDomain(result.domain);
                  setAvailability(AVAILABILITY[result.status]);
                })
              }
            >
              {checking ? "Consultando…" : "Ver se está livre"}
            </Button>
            {availability ? (
              <span role="status" className="text-sm">
                {availability}
              </span>
            ) : null}
          </div>
        ) : null}
      </fieldset>
      <div className={field}>
        <Label htmlFor="couponCode">Cupom (opcional)</Label>
        <Input id="couponCode" name="couponCode" maxLength={40} />
      </div>

      <div className="flex flex-col gap-2 sm:col-span-2">
        <Button type="submit" size="lg" disabled={pending} className="self-start">
          {pending ? "Criando…" : "Criar conta e gerar Pix"}
        </Button>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          A conta nasce sem teste grátis e fica liberada quando o Pix for pago. O cliente recebe o
          acesso por e-mail.
        </p>
      </div>
    </form>
  );
}
