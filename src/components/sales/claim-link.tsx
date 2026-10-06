"use client";

import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

import type { SlugCheck } from "@/lib/business/slug-check";
import { saveDesiredSlug } from "@/lib/desired-slug";

import { checkClaimSlugAction } from "./claim-actions";

/** "Studio Bêla " -> "studio-bela-": lowercase letters, digits and single hyphens. */
function typingSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, 40);
}

/**
 * "meetchat.com/ [seu-nome] [Criar meu chat]": the visitor picks the link of their chat right on
 * the sales page, sees if it is free and goes to sign-up with it saved for the wizard.
 */
export function ClaimLink({ prefix, signupHref }: { prefix: string; signupHref: string }) {
  const router = useRouter();
  const inputId = useId();
  const statusId = useId();
  const [typed, setTyped] = useState("");
  // While typing a trailing hyphen is fine ("studio-" before "bela"); it is dropped when checking.
  const slug = typed.replace(/-+$/, "");
  const [checked, setChecked] = useState<{ slug: string; result: SlugCheck } | null>(null);
  const result = checked?.slug === slug ? checked.result : null;
  const checking = slug.length >= 3 && !result;

  // Debounced availability check; the answer is kept with the slug it belongs to.
  useEffect(() => {
    if (slug.length < 3) return;
    const timer = setTimeout(() => {
      checkClaimSlugAction(slug)
        .then((answer) => setChecked({ slug, result: answer }))
        .catch(() => undefined);
    }, 400);
    return () => clearTimeout(timer);
  }, [slug]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (result && !result.available) return;
    if (slug.length >= 3) saveDesiredSlug(slug);
    router.push(signupHref);
  }

  return (
    <form onSubmit={submit} className="w-full max-w-xl">
      <div className="flex flex-col gap-2 rounded-2xl border bg-card p-2 shadow-lg sm:flex-row sm:items-center">
        <label
          htmlFor={inputId}
          className="flex min-w-0 flex-1 items-center rounded-xl px-3 focus-within:ring-2 focus-within:ring-ring"
        >
          <span className="shrink-0 font-semibold text-foreground">{prefix}</span>
          <input
            id={inputId}
            value={typed}
            onChange={(e) => setTyped(typingSlug(e.target.value))}
            placeholder="seu-nome"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-describedby={statusId}
            aria-label="Escolha o link do seu chat"
            className="h-12 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/70"
          />
        </label>
        <button
          type="submit"
          className="site-card-glow inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Criar meu chat <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
      <p id={statusId} aria-live="polite" className="mt-2 min-h-5 px-3 text-sm">
        {checking ? (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden /> Verificando…
          </span>
        ) : result?.available ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-primary">
            <Check className="size-4" aria-hidden /> {prefix}
            {slug} está livre!
          </span>
        ) : result ? (
          <span className="text-destructive">
            {result.message}{" "}
            {result.suggestion ? (
              <button
                type="button"
                onClick={() => setTyped(result.suggestion!)}
                className="font-medium text-primary underline underline-offset-4"
              >
                Usar {result.suggestion}
              </button>
            ) : null}
          </span>
        ) : (
          <span className="text-muted-foreground">Ex.: studio-bela, dra-ana, barbearia-do-ze</span>
        )}
      </p>
    </form>
  );
}
