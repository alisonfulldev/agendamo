import { Check, Clock } from "lucide-react";

import { OpenCreationLink } from "@/components/creation/open-creation";
import { PLAN_CARDS, PLANS_NOTE } from "@/content/plans";

/** The three plans side by side; every button opens the creation conversation. */
export function PlanCards({ niche }: { niche?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        {PLAN_CARDS.map((plan) => (
          <div
            key={plan.tier}
            className={`flex flex-col gap-4 rounded-3xl bg-card p-6 text-card-foreground ${
              plan.highlight ? "site-card-glow border-2 border-primary/40" : "border"
            }`}
          >
            <div>
              <p className="flex items-center justify-between font-semibold">
                {plan.name}
                {plan.highlight ? (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Mais escolhido
                  </span>
                ) : null}
              </p>
              <p className="mt-3 flex items-baseline gap-1">
                <span className="font-heading text-4xl font-bold tracking-tight">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{plan.note}</p>
              <p className="mt-3 text-sm font-medium">{plan.tagline}</p>
            </div>
            <ul className="flex flex-1 flex-col gap-2 text-sm">
              {plan.includes.map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {item}
                </li>
              ))}
              {plan.soon?.map((item) => (
                <li key={item} className="flex gap-2 text-muted-foreground">
                  <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <OpenCreationLink
              niche={niche}
              className={`flex h-12 items-center justify-center rounded-xl text-base font-semibold transition-opacity hover:opacity-90 ${
                plan.highlight ? "bg-primary text-primary-foreground" : "border bg-background"
              }`}
            >
              {plan.cta}
            </OpenCreationLink>
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">{PLANS_NOTE}</p>
    </div>
  );
}
