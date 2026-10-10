import { Check, Lock } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LOCK_TEXT, LOCKED_FEATURES } from "@/content/plan-locks";
import type { LockedFeature } from "@/lib/plans";

/** A paid page on the Grátis plan: what it does, with the plans and the 7-day trial. */
export function LockedPage({
  feature,
  trialAvailable,
}: {
  feature: LockedFeature;
  trialAvailable: boolean;
}) {
  const info = LOCKED_FEATURES[feature];
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center text-card-foreground">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Lock className="size-6" aria-hidden />
      </span>
      <p className="text-sm font-medium text-primary">{LOCK_TEXT.badge}</p>
      <h1 className="text-2xl font-bold">{info.title}</h1>
      <p className="text-muted-foreground">{info.description}</p>
      <ul className="flex flex-col gap-1.5 text-left text-sm">
        {info.bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            {bullet}
          </li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/painel/plano">{LOCK_TEXT.plans}</Link>
        </Button>
        {trialAvailable ? (
          <Button asChild variant="outline">
            <Link href="/painel/plano#teste">{LOCK_TEXT.trial}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
