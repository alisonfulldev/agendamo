"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { FieldShell, FormMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";

import { changeNicheAction } from "./actions";

export interface NicheOption {
  key: string;
  label: string;
  /** Default services of the niche (offered as a replacement). */
  services: string[];
}

/**
 * "Seu ramo": change the niche at any time. The chat texts, colors and suggested services follow
 * it; the owner chooses to keep the current services or use the niche's defaults.
 */
export function NicheForm({
  current,
  groups,
}: {
  current: string;
  groups: { label: string; options: NicheOption[] }[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(current);
  const [replace, setReplace] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const option = groups.flatMap((g) => g.options).find((o) => o.key === selected);
  const changed = selected !== current;

  return (
    <div className="flex flex-col gap-4">
      <FieldShell name="niche" label="Ramo do negócio">
        <select
          id="niche"
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            setReplace(false);
            setMessage(null);
          }}
          className="h-10 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
        >
          {groups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </FieldShell>

      {changed && option ? (
        <fieldset className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
          <legend className="px-1 font-medium">E os seus serviços?</legend>
          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="replace"
              checked={!replace}
              onChange={() => setReplace(false)}
              className="mt-1 accent-primary"
            />
            <span>Manter os meus serviços atuais</span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="replace"
              checked={replace}
              onChange={() => setReplace(true)}
              className="mt-1 accent-primary"
            />
            <span>
              Usar os serviços padrão de {option.label}: {option.services.join(", ")}.
              <span className="block text-muted-foreground">
                Os atuais saem do chat, mas o histórico de agendamentos continua.
              </span>
            </span>
          </label>
        </fieldset>
      ) : null}

      <div>
        <Button
          type="button"
          disabled={!changed || pending}
          onClick={() =>
            startTransition(async () => {
              const result = await changeNicheAction({
                brandKey: selected,
                replaceServices: replace,
              });
              setMessage({ ok: result.ok, text: result.message });
              if (result.ok) router.refresh();
            })
          }
        >
          {pending ? "Trocando…" : "Trocar ramo"}
        </Button>
      </div>
      {message ? <FormMessage state={{ ok: message.ok, message: message.text }} /> : null}
      <p className="text-sm text-muted-foreground">
        O ramo define as cores, os textos do chat e os serviços sugeridos.
      </p>
    </div>
  );
}
