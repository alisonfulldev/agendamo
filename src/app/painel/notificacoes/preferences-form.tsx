"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import { savePreferencesAction } from "./actions";

interface Preference {
  type: string;
  label: string;
  email: boolean;
  push: boolean;
}

export function PreferencesForm({ initial }: { initial: Preference[] }) {
  const [prefs, setPrefs] = useState(initial);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (type: string, channel: "email" | "push", value: boolean) =>
    setPrefs((current) => current.map((p) => (p.type === type ? { ...p, [channel]: value } : p)));

  return (
    <div className="flex flex-col gap-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="py-2 font-medium">Aviso</th>
            <th className="w-20 py-2 text-center font-medium">E-mail</th>
            <th className="w-20 py-2 text-center font-medium">Celular</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {prefs.map((p) => (
            <tr key={p.type}>
              <td className="py-3">{p.label}</td>
              <td className="py-3 text-center">
                <Switch
                  aria-label={`${p.label} por e-mail`}
                  checked={p.email}
                  onCheckedChange={(v) => set(p.type, "email", v)}
                />
              </td>
              <td className="py-3 text-center">
                <Switch
                  aria-label={`${p.label} no celular`}
                  checked={p.push}
                  onCheckedChange={(v) => set(p.type, "push", v)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button
        type="button"
        className="self-start"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await savePreferencesAction(
              prefs.map(({ type, email, push }) => ({ type, email, push })),
            );
            setSaved(result.ok);
          })
        }
      >
        {pending ? "Salvando…" : "Salvar preferências"}
      </Button>
      {saved !== null ? (
        <p role="status" className={`text-sm ${saved ? "text-primary" : "text-destructive"}`}>
          {saved ? "Preferências salvas." : "Não foi possível salvar."}
        </p>
      ) : null}
    </div>
  );
}
