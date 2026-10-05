"use client";

import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";

import { FieldShell, FormMessage, TextAreaField, TextField } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { Service } from "@/lib/db/types";
import { initialFormState } from "@/lib/forms";
import { formatAmount, formatBRL, formatDuration } from "@/lib/money";

import { deleteServiceAction, reorderServicesAction, saveServiceAction } from "./actions";

const selectClass = "h-10 rounded-lg border border-input bg-transparent px-2 text-sm";

function ServiceForm({
  service,
  depositsEnabled,
  onDone,
}: {
  service: Service | null;
  depositsEnabled: boolean;
  onDone: () => void;
}) {
  const [state, action] = useActionState(saveServiceAction, initialFormState);
  const [depositType, setDepositType] = useState(service?.deposit_type ?? "none");
  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="id" value={service?.id ?? ""} />
      <TextField
        name="name"
        label="Nome"
        defaultValue={service?.name}
        maxLength={100}
        state={state}
      />
      <TextAreaField
        name="description"
        label="Descrição (opcional)"
        rows={2}
        defaultValue={service?.description ?? ""}
        state={state}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          name="duration_minutes"
          label="Duração (min)"
          type="number"
          min={5}
          step={5}
          defaultValue={service?.duration_minutes ?? 30}
          state={state}
        />
        <TextField
          name="buffer_minutes"
          label="Intervalo depois (min)"
          type="number"
          min={0}
          step={5}
          defaultValue={service?.buffer_minutes ?? 0}
          hint="Limpeza ou preparo."
          state={state}
        />
        <TextField
          name="price"
          label="Preço (R$)"
          inputMode="decimal"
          defaultValue={service ? formatAmount(service.price_cents) : ""}
          state={state}
        />
      </div>
      {depositsEnabled ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell name="deposit_type" label="Sinal por Pix">
            <select
              id="deposit_type"
              name="deposit_type"
              value={depositType}
              onChange={(e) => setDepositType(e.target.value as Service["deposit_type"])}
              className={selectClass}
            >
              <option value="none">Sem sinal</option>
              <option value="fixed">Valor fixo</option>
              <option value="percent">Porcentagem do preço</option>
            </select>
          </FieldShell>
          {depositType !== "none" ? (
            <TextField
              name="deposit_value"
              label={depositType === "fixed" ? "Valor do sinal (R$)" : "Sinal (%)"}
              inputMode="decimal"
              defaultValue={
                service && service.deposit_type === depositType
                  ? depositType === "fixed"
                    ? formatAmount(service.deposit_value)
                    : String(service.deposit_value)
                  : ""
              }
              state={state}
            />
          ) : null}
        </div>
      ) : (
        <input type="hidden" name="deposit_type" value="none" />
      )}
      <TextField
        name="return_after_days"
        label="Retorno ideal após (dias, opcional)"
        type="number"
        min={1}
        defaultValue={service?.return_after_days ?? ""}
        hint="Ex.: 15 para manutenção de unhas, 30 para corte. Depois de agendar, o chat oferece já deixar o próximo marcado nessa data. Também usado em “Hora de voltar”."
        state={state}
      />
      <label className="flex items-center justify-between gap-3">
        <span className="font-medium">Ativo (aparece no chat e no perfil)</span>
        <Switch name="active" defaultChecked={service?.active ?? true} />
      </label>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Salvando…">Salvar serviço</SubmitButton>
    </form>
  );
}

export function ServicesManager({
  services,
  depositsEnabled,
}: {
  services: Service[];
  depositsEnabled: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= services.length) return;
    const ids = services.map((s) => s.id);
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    startTransition(async () => {
      await reorderServicesAction(ids);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3" aria-busy={pending}>
      <ul className="flex flex-col gap-2">
        {services.map((service, index) => (
          <li key={service.id} className="flex items-center gap-3 rounded-xl border p-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {service.name} {!service.active ? <Badge variant="secondary">Inativo</Badge> : null}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDuration(service.duration_minutes)} · {formatBRL(service.price_cents)}
                {service.deposit_type !== "none" ? " · com sinal" : ""}
              </p>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Subir ${service.name}`}
              onClick={() => move(index, -1)}
            >
              <ChevronUp />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Descer ${service.name}`}
              onClick={() => move(index, 1)}
            >
              <ChevronDown />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Editar ${service.name}`}
              onClick={() => setEditing(service)}
            >
              <Pencil />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Excluir ${service.name}`}
              onClick={() =>
                startTransition(async () => {
                  if (!window.confirm(`Excluir “${service.name}”?`)) return;
                  const result = await deleteServiceAction(service.id);
                  setError(result.ok ? null : (result.error ?? null));
                  router.refresh();
                })
              }
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="self-start"
        onClick={() => setEditing("new")}
      >
        <Plus /> Novo serviço
      </Button>
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Novo serviço" : "Editar serviço"}</DialogTitle>
          </DialogHeader>
          {editing !== null ? (
            <ServiceForm
              key={editing === "new" ? "new" : editing.id}
              service={editing === "new" ? null : editing}
              depositsEnabled={depositsEnabled}
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
