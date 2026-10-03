"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { createCouponAction, extendTrialAction, setSuspendedAction } from "./actions";

export function BusinessActions({ id, suspended }: { id: string; suspended: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          const days = Number(window.prompt("Estender o teste em quantos dias?", "7"));
          if (!days) return;
          startTransition(async () => setMessage((await extendTrialAction(id, days)).message));
        }}
      >
        Estender teste
      </Button>
      <Button
        type="button"
        size="sm"
        variant={suspended ? "default" : "ghost"}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            if (!suspended && !window.confirm("Suspender este negócio? A página sai do ar."))
              return;
            await setSuspendedAction(id, !suspended);
          })
        }
      >
        {suspended ? "Reativar" : "Suspender"}
      </Button>
      {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
    </div>
  );
}

export function CouponForm({ brands }: { brands: { key: string; name: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="grid gap-2 sm:grid-cols-6"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form));
        startTransition(async () => {
          const result = await createCouponAction(data);
          setMessage({ ok: result.ok, text: result.message });
          if (result.ok) form.reset();
        });
      }}
    >
      <Input name="code" aria-label="Código" placeholder="CÓDIGO" className="h-10 sm:col-span-2" />
      <Input
        name="discountPercent"
        aria-label="Desconto (%)"
        type="number"
        min={1}
        max={100}
        placeholder="% desconto"
        className="h-10"
      />
      <Input name="validUntil" aria-label="Válido até" type="date" className="h-10" />
      <Input
        name="maxUses"
        aria-label="Usos máximos"
        type="number"
        min={1}
        placeholder="usos"
        className="h-10"
      />
      <select
        name="brandKey"
        aria-label="Marca"
        className="h-10 rounded-lg border border-input bg-transparent px-2 text-sm"
      >
        <option value="">Todas as marcas</option>
        {brands.map((b) => (
          <option key={b.key} value={b.key}>
            {b.name}
          </option>
        ))}
      </select>
      <Button type="submit" disabled={pending} className="sm:col-span-6 sm:justify-self-start">
        Criar cupom
      </Button>
      {message ? (
        <p
          role="status"
          className={`text-sm sm:col-span-6 ${message.ok ? "text-primary" : "text-destructive"}`}
        >
          {message.text}
        </p>
      ) : null}
    </form>
  );
}
