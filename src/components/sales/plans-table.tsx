import { Check, Clock } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PLAN_CARDS, PLANS_NOTE } from "@/content/plans";

/** The three plans with links to the sign-up form (sales page of a niche on its own domain). */
export function PlansTable({ signupHref = "/cadastro" }: { signupHref?: string }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-3">
        {PLAN_CARDS.map((plan) => (
          <div
            key={plan.tier}
            className={`flex flex-col gap-6 rounded-3xl border bg-card p-8 text-card-foreground ${
              plan.highlight ? "site-card-glow border-2 border-primary/50" : ""
            }`}
          >
            <div>
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="font-heading text-4xl font-bold tracking-tight">{plan.price}</span>
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
              <Link href={signupHref}>{plan.cta}</Link>
            </Button>
            <ul className="flex flex-1 flex-col gap-3 border-t pt-6 text-sm">
              {plan.includes.map((feature) => (
                <li key={feature} className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {feature}
                </li>
              ))}
              {plan.soon?.map((feature) => (
                <li key={feature} className="flex gap-3 text-muted-foreground">
                  <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mx-auto max-w-2xl text-center text-sm text-pretty text-muted-foreground">
        {PLANS_NOTE}
      </p>
    </div>
  );
}
