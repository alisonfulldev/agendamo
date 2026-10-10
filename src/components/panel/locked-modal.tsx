"use client";

import { Check, Lock, X } from "lucide-react";
import Link from "next/link";

import { LOCK_TEXT, LOCKED_FEATURES } from "@/content/plan-locks";
import type { LockedFeature } from "@/lib/plans";

/** Subscription modal opened by a locked menu item (Grátis plan). */
export function LockedModal({
  feature,
  trialAvailable,
  onClose,
}: {
  feature: LockedFeature;
  trialAvailable: boolean;
  onClose: () => void;
}) {
  const info = LOCKED_FEATURES[feature];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-foreground/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="locked-title"
        className="relative w-full max-w-md rounded-t-3xl bg-background p-6 pb-10 text-center shadow-2xl sm:rounded-3xl sm:pb-6 motion-safe:animate-in motion-safe:slide-in-from-bottom"
      >
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full hover:bg-muted"
        >
          <X className="size-5" />
        </button>
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="size-5" aria-hidden />
        </span>
        <p className="mt-3 text-sm font-medium text-primary">{feature === "deposits" ? LOCK_TEXT.proBadge : LOCK_TEXT.badge}</p>
        <p id="locked-title" className="mt-1 text-xl font-bold">
          {info.title}
        </p>
        <p className="mt-2 text-muted-foreground">{info.description}</p>
        <ul className="mx-auto mt-4 flex w-fit flex-col gap-1.5 text-left text-sm">
          {info.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              {bullet}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-col gap-2">
          <Link
            href="/painel/plano"
            onClick={onClose}
            className="flex h-12 items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground"
          >
            {LOCK_TEXT.plans}
          </Link>
          {trialAvailable ? (
            <Link
              href="/painel/plano#teste"
              onClick={onClose}
              className="flex h-12 items-center justify-center rounded-xl border font-semibold"
            >
              {LOCK_TEXT.trial}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
