import { Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/money";
import { PLAN_PRICES, subscriptionPrice, TRIAL_DAYS, yearlySavings } from "@/lib/plans";

const FEATURES = [
  "Link de agendamento que abre direto no chat",
  "A cliente escolhe o horário e já fica agendada, 24 horas por dia",
  "Perfil com fotos, serviços, preços e avaliações",
  "Agenda, lembretes e confirmações automáticas",
  "Financeiro: receitas, custos e lucro do mês",
  "Sinal por Pix, combos, pacotes, cupons e ferramentas de venda",
  "Google Agenda e botão de agendamento no seu site",
];

/** Single plan: trial, then monthly or yearly (with the yearly saving). */
export function PlansTable() {
  const monthly = subscriptionPrice("monthly", 0);
  const yearly = subscriptionPrice("yearly", 0);
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        {[
          {
            key: "monthly",
            name: "Mensal",
            price: formatBRL(monthly),
            period: "por mês",
            note: "Cancele quando quiser",
          },
          {
            key: "yearly",
            name: "Anual",
            price: formatBRL(yearly),
            period: "por ano",
            note: `Sai ${formatBRL(Math.round(yearly / 12))}/mês: você economiza ${formatBRL(yearlySavings(0))}`,
            highlight: true,
          },
        ].map((plan) => (
          <div
            key={plan.key}
            className={`relative flex flex-col gap-4 rounded-2xl border bg-card p-6 text-card-foreground ${plan.highlight ? "ring-2 ring-primary" : ""}`}
          >
            {plan.highlight ? (
              <span className="absolute -top-3 right-5 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                Mais vantajoso
              </span>
            ) : null}
            <div>
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="mt-2">
                <span className="font-heading text-3xl font-bold">{plan.price}</span>{" "}
                <span className="text-muted-foreground">{plan.period}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{plan.note}</p>
            </div>
            <ul className="flex flex-1 flex-col gap-2 text-sm">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>
            <Button asChild variant={plan.highlight ? "default" : "outline"} className="h-11">
              <Link href="/cadastro">Testar {TRIAL_DAYS} dias grátis</Link>
            </Button>
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {TRIAL_DAYS} dias grátis, sem cartão. 1 profissional incluso; cada profissional extra{" "}
        {formatBRL(PLAN_PRICES.extraProfessional.monthly)}/mês. Adicionais: Destaque no portal (
        {formatBRL(PLAN_PRICES.featured.monthly)}/mês por cidade) e Domínio próprio.
      </p>
    </div>
  );
}
