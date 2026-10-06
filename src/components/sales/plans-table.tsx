import { Check, Sparkles } from "lucide-react";
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
export function PlansTable({ signupHref = "/cadastro" }: { signupHref?: string }) {
  const monthly = subscriptionPrice("monthly", 0);
  const yearly = subscriptionPrice("yearly", 0);
  const plans = [
    {
      key: "monthly",
      name: "Mensal",
      price: formatBRL(monthly),
      period: "/mês",
      note: "Sem fidelidade. Cancele quando quiser.",
      highlight: false,
    },
    {
      key: "yearly",
      name: "Anual",
      price: formatBRL(Math.round(yearly / 12)),
      period: "/mês",
      note: `${formatBRL(yearly)} por ano. Você economiza ${formatBRL(yearlySavings(0))}.`,
      highlight: true,
    },
  ];
  return (
    <div className="flex flex-col gap-8">
      <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={`relative flex flex-col gap-6 rounded-3xl border bg-card p-8 text-card-foreground transition-shadow ${
              plan.highlight ? "site-card-glow border-2 border-primary/50" : "hover:shadow-lg"
            }`}
          >
            {plan.highlight ? (
              <span className="absolute -top-3.5 left-8 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
                <Sparkles className="size-3.5" aria-hidden /> Mais vantajoso
              </span>
            ) : null}
            <div>
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="font-heading text-5xl font-bold tracking-tight">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{plan.note}</p>
            </div>
            <Button
              asChild
              size="lg"
              variant={plan.highlight ? "default" : "outline"}
              className="h-12 text-base"
            >
              <Link href={signupHref}>Testar {TRIAL_DAYS} dias grátis</Link>
            </Button>
            <ul className="flex flex-1 flex-col gap-3 border-t pt-6 text-sm">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="size-3" aria-hidden />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mx-auto max-w-2xl text-center text-sm text-pretty text-muted-foreground">
        {TRIAL_DAYS} dias grátis, sem cartão. 1 profissional incluso; cada profissional extra{" "}
        {formatBRL(PLAN_PRICES.extraProfessional.monthly)}/mês. Adicionais: Destaque no portal (
        {formatBRL(PLAN_PRICES.featured.monthly)}/mês por cidade).
      </p>
    </div>
  );
}
