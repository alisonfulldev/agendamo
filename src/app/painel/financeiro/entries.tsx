"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { FieldShell } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHOD_LABELS,
  type FinanceEntry,
  type FinanceKind,
  type PaymentMethod,
} from "@/lib/finance";
import { formatBRL } from "@/lib/money";

import { createEntryAction, deleteEntryAction, setPaymentMethodAction } from "./actions";

const selectClass = "h-10 w-full rounded-lg border border-input bg-transparent px-2 text-sm";

/** New revenue or cost. */
export function EntryForm({
  defaultDate,
  customers,
}: {
  defaultDate: string;
  customers: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<FinanceKind>("expense");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const categories = kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  if (!open) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => {
            setKind("expense");
            setOpen(true);
          }}
        >
          <Plus /> Lançar custo
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setKind("income");
            setOpen(true);
          }}
        >
          <Plus /> Lançar receita avulsa
        </Button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-xl border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await createEntryAction({
            kind,
            category: form.get("category"),
            description: form.get("description"),
            amount: form.get("amount"),
            occurredOn: form.get("occurredOn"),
            paymentMethod: form.get("paymentMethod") ?? "",
            customerId: form.get("customerId") ?? "",
          });
          if (result.ok) {
            setMessage(null);
            setOpen(false);
          } else setMessage(result.message);
        });
      }}
    >
      <div role="group" aria-label="Tipo" className="flex self-start rounded-lg border p-0.5">
        {(["expense", "income"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
            className={`rounded-md px-3 py-1.5 text-sm ${kind === k ? "bg-primary text-primary-foreground" : ""}`}
          >
            {k === "expense" ? "Custo" : "Receita"}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldShell name="description" label="Descrição">
          <Input
            id="description"
            name="description"
            required
            maxLength={200}
            placeholder={kind === "expense" ? "Ex.: aluguel de outubro" : "Ex.: venda de esmalte"}
            className="h-10"
          />
        </FieldShell>
        <FieldShell name="category" label="Categoria">
          <select id="category" name="category" key={kind} className={selectClass}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FieldShell>
        <FieldShell name="amount" label="Valor (R$)">
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            required
            placeholder="0,00"
            className="h-10"
          />
        </FieldShell>
        <FieldShell name="occurredOn" label="Data">
          <Input
            id="occurredOn"
            name="occurredOn"
            type="date"
            required
            defaultValue={defaultDate}
            className="h-10"
          />
        </FieldShell>
        {kind === "income" ? (
          <>
            <FieldShell name="paymentMethod" label="Forma de pagamento">
              <select id="paymentMethod" name="paymentMethod" className={selectClass}>
                <option value="">Não informar</option>
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </option>
                ))}
              </select>
            </FieldShell>
            <FieldShell name="customerId" label="Cliente (opcional)">
              <select id="customerId" name="customerId" className={selectClass}>
                <option value="">Sem cliente</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FieldShell>
          </>
        ) : null}
      </div>
      {message ? (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

/** One line: date, description, customer, category, payment method (revenues), amount. */
export function EntryRow({ entry }: { entry: FinanceEntry }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const income = entry.kind === "income";
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="w-12 shrink-0 text-sm text-muted-foreground">
        {entry.occurred_on.slice(8, 10)}/{entry.occurred_on.slice(5, 7)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{entry.description}</p>
        <p className="truncate text-xs text-muted-foreground">
          {entry.category}
          {entry.customer?.name ? ` · ${entry.customer.name}` : ""}
          {entry.appointment_id ? " · automático" : ""}
        </p>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
      {income ? (
        <select
          aria-label={`Forma de pagamento de ${entry.description}`}
          defaultValue={entry.payment_method ?? ""}
          disabled={pending}
          onChange={(e) =>
            startTransition(async () => {
              const result = await setPaymentMethodAction(entry.id, e.target.value);
              setError(result.ok ? null : result.message);
            })
          }
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
        >
          <option value="">Forma de pagamento</option>
          {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
            <option key={m} value={m}>
              {PAYMENT_METHOD_LABELS[m]}
            </option>
          ))}
        </select>
      ) : null}
      <span className={`w-28 shrink-0 text-right font-semibold ${income ? "text-primary" : ""}`}>
        {income ? "+" : "−"} {formatBRL(entry.amount_cents)}
      </span>
      {entry.appointment_id ? (
        <span className="w-8" />
      ) : (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={`Excluir ${entry.description}`}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              if (!window.confirm("Excluir este lançamento?")) return;
              const result = await deleteEntryAction(entry.id);
              setError(result.ok ? null : result.message);
            })
          }
        >
          <Trash2 />
        </Button>
      )}
    </li>
  );
}
