import { Check } from "lucide-react";

import { OpenCreationLink } from "@/components/creation/open-creation";
import { PLAN_CARD, PLANS_NOTE } from "@/content/plans";

/** The single plan; the button opens the creation conversation. */
export function PlanCards({ niche }: { niche?: string }) {
  const plan = PLAN_CARD;
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="site-card-glow flex w-full max-w-md flex-col gap-4 rounded-3xl border-2 border-primary/40 bg-card p-6 text-card-foreground">
        <div>
          <p className="font-semibold">{plan.name}</p>
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
        </ul>
        <OpenCreationLink
          niche={niche}
          className="flex h-12 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {plan.cta}
        </OpenCreationLink>
      </div>
      <p className="max-w-xl text-center text-sm text-muted-foreground">{PLANS_NOTE}</p>
    </div>
  );
}
