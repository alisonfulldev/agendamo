import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { PlanFeatures } from "@/lib/plans";

/** Shown when the trial ended without a subscription: what the feature does and how to get it back. */
export function UpgradeNotice({
  title,
  description,
  bullets,
}: {
  title: string;
  description: string;
  bullets?: string[];
  features?: PlanFeatures;
  team?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card p-6 text-card-foreground">
      <p className="text-sm font-medium text-primary">Assinatura</p>
      <h2 className="mt-1 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-muted-foreground">{description}</p>
      {bullets?.length ? (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/painel/plano">Assinar</Link>
        </Button>
      </div>
    </div>
  );
}
