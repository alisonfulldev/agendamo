"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { FieldShell } from "@/components/forms/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { Service } from "@/lib/db/types";
import { formatAmount, formatBRL, formatDuration } from "@/lib/money";

import { deleteComboAction, saveComboAction } from "./actions";

export interface ComboView {
  id: string;
  name: string;
  price_cents: number;
  active: boolean;
  serviceIds: string[];
}

function ComboForm({
  combo,
  services,
  onDone,
}: {
  combo: ComboView | null;
  services: Service[];
  onDone: () => void;
}) {
  const [name, setName] = useState(combo?.name ?? "");
  const [price, setPrice] = useState(combo ? formatAmount(combo.price_cents) : "");
  const [selected, setSelected] = useState<string[]>(combo?.serviceIds ?? []);
  const [active, setActive] = useState(combo?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const chosen = selected
    .map((id) => services.find((s) => s.id === id))
    .filter(Boolean) as Service[];
  const fullPrice = chosen.reduce((sum, s) => sum + s.price_cents, 0);
  const duration = chosen.reduce((sum, s) => sum + s.duration_minutes + s.buffer_minutes, 0);

  return (
    <div className="flex flex-col gap-4">
      <FieldShell name="combo-name" label="Nome do combo">
        <Input
          id="combo-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          className="h-10"
        />
      </FieldShell>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Serviços (na ordem do atendimento)</legend>
        {services.map((service) => (
          <label key={service.id} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={selected.includes(service.id)}
              onCheckedChange={(checked) =>
                setSelected((current) =>
                  checked ? [...current, service.id] : current.filter((id) => id !== service.id),
                )
              }
            />
            {service.name} · {formatDuration(service.duration_minutes)} ·{" "}
            {formatBRL(service.price_cents)}
          </label>
        ))}
      </fieldset>
      {chosen.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          Duração total: {formatDuration(duration)} · Preço separado: {formatBRL(fullPrice)}
        </p>
      ) : null}
      <FieldShell name="combo-price" label="Preço promocional (R$)">
        <Input
          id="combo-price"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="h-10"
        />
      </FieldShell>
      <label className="flex items-center justify-between gap-3">
        <span className="font-medium">Ativo</span>
        <Switch checked={active} onCheckedChange={setActive} />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await saveComboAction({
              id: combo?.id ?? null,
              name,
              price,
              serviceIds: selected,
              active,
            });
            if (result.ok) onDone();
            else setError(result.error ?? "Erro");
          })
        }
      >
        {pending ? "Salvando…" : "Salvar combo"}
      </Button>
    </div>
  );
}

export function CombosEditor({ combos, services }: { combos: ComboView[]; services: Service[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<ComboView | "new" | null>(null);
  const [, startTransition] = useTransition();
  const names = (ids: string[]) =>
    ids
      .map((id) => services.find((s) => s.id === id)?.name)
      .filter(Boolean)
      .join(" + ");

  return (
    <div className="flex flex-col gap-3">
      {combos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Junte serviços com um preço especial, como “Corte + barba”.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {combos.map((combo) => (
            <li key={combo.id} className="flex items-center gap-3 rounded-xl border p-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {combo.name} {!combo.active ? <Badge variant="secondary">Inativo</Badge> : null}
                </p>
                <p className="text-sm text-muted-foreground">
                  {names(combo.serviceIds)} · {formatBRL(combo.price_cents)}
                </p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={`Editar ${combo.name}`}
                onClick={() => setEditing(combo)}
              >
                <Pencil />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={`Excluir ${combo.name}`}
                onClick={() =>
                  startTransition(async () => {
                    if (!window.confirm(`Excluir “${combo.name}”?`)) return;
                    await deleteComboAction(combo.id);
                    router.refresh();
                  })
                }
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button
        type="button"
        variant="outline"
        className="self-start"
        onClick={() => setEditing("new")}
        disabled={services.length < 2}
      >
        <Plus /> Novo combo
      </Button>
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Novo combo" : "Editar combo"}</DialogTitle>
          </DialogHeader>
          {editing !== null ? (
            <ComboForm
              key={editing === "new" ? "new" : editing.id}
              combo={editing === "new" ? null : editing}
              services={services}
              onDone={() => {
                setEditing(null);
                router.refresh();
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
