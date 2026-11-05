import { CheckCircle2, ChevronRight, Circle } from "lucide-react";
import Link from "next/link";

import { CopyTextButton } from "@/components/panel/copy-text-button";
import { Button } from "@/components/ui/button";

export interface HomeStep {
  id: string;
  done: boolean;
  label: string;
  hint: string;
  /** Screen of the step, or a text to copy (bonus links). */
  action: { href: string; label: string; download?: boolean } | { copy: string; label: string };
  /** Small tag next to the label ("+7 dias"). */
  badge?: string;
}

/**
 * "Próximo passo" on Início (2026-11-05): one card with only the next thing to do and the
 * progress; the full list stays one tap away. Disappears when everything is done.
 */
export function NextStepCard({ steps }: { steps: HomeStep[] }) {
  const next = steps.find((s) => !s.done);
  if (!next) return null;
  const done = steps.filter((s) => s.done).length;

  return (
    <section aria-labelledby="proximo-passo" className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="proximo-passo" className="text-sm font-semibold text-muted-foreground">
          Próximo passo
        </h2>
        <span className="text-sm text-muted-foreground">
          {done} de {steps.length}
        </span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Passos concluídos"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={done}
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${(done / steps.length) * 100}%` }}
        />
      </div>

      <p className="mt-4 text-lg font-semibold">
        {next.label}
        {next.badge ? (
          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 align-middle text-xs font-semibold text-primary">
            {next.badge}
          </span>
        ) : null}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{next.hint}</p>
      {"copy" in next.action ? (
        <>
          <p className="my-3 rounded-md bg-muted px-3 py-2 text-sm break-words">
            {next.action.copy}
          </p>
          <CopyTextButton text={next.action.copy} label={next.action.label} variant="default" />
        </>
      ) : (
        <Button asChild className="mt-3">
          {next.action.download ? (
            // A file (route handler), not a page: plain link, never prefetched.
            <a href={next.action.href} download>
              {next.action.label}
            </a>
          ) : (
            <Link href={next.action.href}>{next.action.label}</Link>
          )}
        </Button>
      )}

      <details className="group mt-4">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-primary [&::-webkit-details-marker]:hidden">
          Ver todos os passos
          <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden />
        </summary>
        <ul className="mt-2 flex flex-col gap-1">
          {steps.map((step) => (
            <li key={step.id} className="flex items-start gap-2 py-1 text-sm">
              {step.done ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-label="Feito" />
              ) : (
                <Circle
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-label="Falta"
                />
              )}
              <span className={step.done ? "text-muted-foreground line-through" : ""}>
                {step.label}
                {step.badge && !step.done ? ` (${step.badge})` : ""}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
