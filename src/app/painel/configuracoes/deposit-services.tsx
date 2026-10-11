"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { DepositType } from "@/lib/db/types";
import { formatAmount, formatBRL } from "@/lib/money";

import { saveServiceDepositsAction, type ServiceDepositsState } from "./actions";

export interface DepositServiceRow {
  id: string;
  name: string;
  price_cents: number;
  deposit_type: DepositType;
  deposit_value: number;
}

const TYPE_LABELS: [DepositType, string][] = [
  ["none", "Sem sinal"],
  ["fixed", "Valor fixo"],
  ["percent", "Porcentagem do preço"],
  ["full", "Pagamento total"],
];

const selectClass = "h-10 rounded-lg border border-input bg-transparent px-2 text-sm";

const valueText = (type: DepositType, value: number) =>
  type === "fixed" ? formatAmount(value) : type === "percent" ? String(value) : "";

/**
 * Which services ask for a deposit, all in one place: a switch, "Aplicar a todos" and the rule of
 * each service. Services at R$ 0 are flagged (the deposit would come out as zero).
 */
export function DepositServicesForm({ services }: { services: DepositServiceRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(() =>
    services.map((s) => ({ ...s, value: valueText(s.deposit_type, s.deposit_value) })),
  );
  const [enabled, setEnabled] = useState(() => services.some((s) => s.deposit_type !== "none"));
  const [bulkType, setBulkType] = useState<DepositType>("fixed");
  const [bulkValue, setBulkValue] = useState("");
  const [result, setResult] = useState<ServiceDepositsState | null>(null);
  const [pending, startTransition] = useTransition();

  const update = (id: string, patch: Partial<(typeof rows)[number]>) =>
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const save = (list: typeof rows) =>
    startTransition(async () => {
      const response = await saveServiceDepositsAction(
        list.map((r) => ({ id: r.id, deposit_type: r.deposit_type, deposit_value: r.value })),
      ).catch(() => ({ ok: false, message: "Não foi possível salvar." }) as ServiceDepositsState);
      setResult(response);
      // Valid services are saved even when another one has a problem: refresh the status.
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center justify-between gap-3 rounded-xl border p-4">
        <span>
          <span className="block font-medium">Pedir sinal pelo Pix ao agendar</span>
          <span className="block text-sm text-muted-foreground">
            O cliente paga, envia o comprovante no chat e o horário fica reservado até você
            confirmar.
          </span>
        </span>
        <Switch
          checked={enabled}
          onCheckedChange={(on) => {
            setEnabled(on);
            setResult(null);
            if (!on) {
              // Turning it off removes the deposit from every service right away.
              const cleared = rows.map((r) => ({ ...r, deposit_type: "none" as const, value: "" }));
              setRows(cleared);
              save(cleared);
            }
          }}
          aria-label="Pedir sinal pelo Pix ao agendar"
        />
      </label>

      {enabled ? (
        <>
          <div className="flex flex-wrap items-end gap-2 rounded-xl bg-muted p-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Para todos os serviços</span>
              <select
                aria-label="Tipo de sinal para todos"
                className={selectClass}
                value={bulkType}
                onChange={(e) => setBulkType(e.target.value as DepositType)}
              >
                {TYPE_LABELS.filter(([t]) => t !== "none").map(([t, label]) => (
                  <option key={t} value={t}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {bulkType !== "full" ? (
              <Input
                aria-label={bulkType === "fixed" ? "Valor do sinal (R$)" : "Sinal (%)"}
                placeholder={bulkType === "fixed" ? "R$ 30,00" : "30%"}
                inputMode="decimal"
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                className="h-10 w-28"
              />
            ) : null}
            <Button
              type="button"
              variant="outline"
              disabled={bulkType !== "full" && !bulkValue.trim()}
              onClick={() =>
                setRows((list) =>
                  list.map((r) => ({
                    ...r,
                    deposit_type: bulkType,
                    value: bulkType === "full" ? "" : bulkValue,
                  })),
                )
              }
            >
              Aplicar a todos
            </Button>
          </div>

          <ul className="divide-y rounded-xl border">
            {rows.map((row) => {
              const zeroPrice =
                row.price_cents <= 0 &&
                (row.deposit_type === "percent" || row.deposit_type === "full");
              const error = result?.errors?.[row.id];
              return (
                <li key={row.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{row.name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {row.price_cents > 0 ? formatBRL(row.price_cents) : "Sem preço"}
                    </span>
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label={`Sinal de ${row.name}`}
                      className={selectClass}
                      value={row.deposit_type}
                      onChange={(e) =>
                        update(row.id, { deposit_type: e.target.value as DepositType, value: "" })
                      }
                    >
                      {TYPE_LABELS.map(([t, label]) => (
                        <option key={t} value={t}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {row.deposit_type === "fixed" || row.deposit_type === "percent" ? (
                      <Input
                        aria-label={
                          row.deposit_type === "fixed"
                            ? `Valor do sinal de ${row.name} (R$)`
                            : `Sinal de ${row.name} (%)`
                        }
                        placeholder={row.deposit_type === "fixed" ? "R$ 30,00" : "30%"}
                        inputMode="decimal"
                        value={row.value}
                        onChange={(e) => update(row.id, { value: e.target.value })}
                        className="h-10 w-28"
                      />
                    ) : null}
                  </div>
                  {zeroPrice || error ? (
                    <p className="text-sm text-destructive sm:basis-full">
                      {error ??
                        "Porcentagem e pagamento total precisam do preço do serviço. Use “Valor fixo” ou defina o preço em Meu perfil › Serviços."}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-2">
            {result?.message ? (
              <p
                role={result.ok ? "status" : "alert"}
                className={`text-sm ${result.ok ? "text-primary" : "text-destructive"}`}
              >
                {result.message}
              </p>
            ) : null}
            <Button
              type="button"
              className="self-start"
              disabled={pending}
              onClick={() => save(rows)}
            >
              {pending ? "Salvando…" : "Salvar sinais"}
            </Button>
          </div>
        </>
      ) : result?.message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {result.ok ? "Sinal desligado em todos os serviços." : result.message}
        </p>
      ) : null}
    </div>
  );
}
