"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatAmount, formatDuration, parseBRL } from "@/lib/money";

export interface ServiceDraft {
  name: string;
  durationMinutes: number;
  priceCents: number;
}

const DURATIONS = [10, 15, 20, 30, 40, 45, 50, 60, 75, 90, 105, 120, 150, 180, 240, 300, 360, 480];

function PriceInput({
  id,
  cents,
  onChange,
}: {
  id: string;
  cents: number;
  onChange: (cents: number) => void;
}) {
  const [text, setText] = useState(cents ? formatAmount(cents) : "");
  return (
    <Input
      id={id}
      inputMode="decimal"
      placeholder="0,00"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const parsed = parseBRL(text) ?? 0;
        onChange(parsed);
        setText(parsed ? formatAmount(parsed) : "");
      }}
      className="h-10"
    />
  );
}

/** Editable list of services with brand suggestions as quick-add chips. */
export function ServicesEditor({
  value,
  onChange,
  suggestions = [],
}: {
  value: ServiceDraft[];
  onChange: (services: ServiceDraft[]) => void;
  suggestions?: { name: string; durationMinutes: number }[];
}) {
  const update = (index: number, patch: Partial<ServiceDraft>) =>
    onChange(value.map((service, i) => (i === index ? { ...service, ...patch } : service)));
  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));
  const add = (service: ServiceDraft) => onChange([...value, service]);
  const unused = suggestions.filter(
    (s) => !value.some((v) => v.name.toLowerCase() === s.name.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-4">
      {unused.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Sugestões (toque para adicionar):</p>
          <div className="flex flex-wrap gap-2">
            {unused.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() =>
                  add({ name: s.name, durationMinutes: s.durationMinutes, priceCents: 0 })
                }
                className="rounded-full border bg-card px-3 py-1.5 text-sm hover:bg-muted"
              >
                + {s.name} · {formatDuration(s.durationMinutes)}
              </button>
            ))}
          </div>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {value.map((service, index) => (
          <li
            key={index}
            className="grid gap-3 rounded-xl border bg-card p-3 sm:grid-cols-[1fr_9rem_8rem_auto] sm:items-end"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`service-${index}-name`}>Serviço</Label>
              <Input
                id={`service-${index}-name`}
                value={service.name}
                maxLength={100}
                onChange={(e) => update(index, { name: e.target.value })}
                className="h-10"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`service-${index}-duration`}>Duração</Label>
              <select
                id={`service-${index}-duration`}
                value={service.durationMinutes}
                onChange={(e) => update(index, { durationMinutes: Number(e.target.value) })}
                className="h-10 rounded-lg border border-input bg-transparent px-2 text-sm"
              >
                {[...new Set([...DURATIONS, service.durationMinutes])]
                  .sort((a, b) => a - b)
                  .map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {formatDuration(minutes)}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`service-${index}-price`}>Preço (R$)</Label>
              <PriceInput
                id={`service-${index}-price`}
                cents={service.priceCents}
                onChange={(priceCents) => update(index, { priceCents })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remover ${service.name || "serviço"}`}
              onClick={() => remove(index)}
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant="outline"
        className="self-start"
        onClick={() => add({ name: "", durationMinutes: 30, priceCents: 0 })}
      >
        <Plus /> Adicionar serviço
      </Button>
    </div>
  );
}
