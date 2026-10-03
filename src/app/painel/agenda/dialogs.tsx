"use client";

import { useEffect, useState, useTransition } from "react";

import { FieldShell } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatBRL, formatDuration } from "@/lib/money";
import { formatBrPhone, maskBrPhone } from "@/lib/phone";

import {
  blockTimeAction,
  createManualAppointmentAction,
  getCustomerPackagesAction,
  searchCustomersAction,
  type CustomerOption,
  type CustomerPackageOption,
} from "./actions";
import { SlotPicker } from "./slot-picker";
import type { AgendaCatalog } from "./types";

const selectClass = "h-10 w-full rounded-lg border border-input bg-transparent px-2 text-sm";

function CustomerPicker({
  value,
  onChange,
}: {
  value: CustomerOption | { name: string; phone: string; email: string } | null;
  onChange: (value: CustomerOption | { name: string; phone: string; email: string } | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ query: string; list: CustomerOption[] } | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", phone: "", email: "" });

  useEffect(() => {
    if (query.trim().length < 2) return;
    const timer = setTimeout(() => {
      searchCustomersAction(query).then((list) => setResults({ query, list }));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (value && "id" in value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border p-2 text-sm">
        <span>
          {value.name}{" "}
          {value.phone ? (
            <span className="text-muted-foreground">· {formatBrPhone(value.phone)}</span>
          ) : null}
          {value.blocked ? <span className="ml-1 text-destructive">(bloqueada)</span> : null}
        </span>
        <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
          Trocar
        </Button>
      </div>
    );
  }

  if (creating) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border p-3">
        <Input
          aria-label="Nome da cliente"
          placeholder="Nome"
          value={draft.name}
          onChange={(e) => {
            const next = { ...draft, name: e.target.value };
            setDraft(next);
            onChange(next);
          }}
          className="h-10"
        />
        <Input
          aria-label="WhatsApp da cliente"
          placeholder="WhatsApp"
          inputMode="tel"
          value={draft.phone}
          onChange={(e) => {
            const next = { ...draft, phone: maskBrPhone(e.target.value) };
            setDraft(next);
            onChange(next);
          }}
          className="h-10"
        />
        <Input
          aria-label="E-mail da cliente"
          placeholder="E-mail (opcional, para avisos)"
          type="email"
          value={draft.email}
          onChange={(e) => {
            const next = { ...draft, email: e.target.value };
            setDraft(next);
            onChange(next);
          }}
          className="h-10"
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="self-start"
          onClick={() => setCreating(false)}
        >
          Buscar cliente cadastrada
        </Button>
      </div>
    );
  }

  const list = results?.query === query ? results.list : [];
  return (
    <div className="flex flex-col gap-2">
      <Input
        aria-label="Buscar cliente"
        placeholder="Buscar por nome ou telefone"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-10"
      />
      {list.length > 0 ? (
        <ul className="max-h-40 overflow-y-auto rounded-lg border">
          {list.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onChange(c)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
              >
                {c.name}{" "}
                {c.phone ? (
                  <span className="text-muted-foreground">· {formatBrPhone(c.phone)}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="self-start"
        onClick={() => setCreating(true)}
      >
        Nova cliente
      </Button>
    </div>
  );
}

export function NewAppointmentDialog({
  open,
  onOpenChange,
  catalog,
  defaultDate,
  defaultProfessional,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalog: AgendaCatalog;
  timezone: string;
  defaultDate: string;
  defaultProfessional: string;
  onDone: () => void;
}) {
  const [customer, setCustomer] = useState<
    CustomerOption | { name: string; phone: string; email: string } | null
  >(null);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [comboId, setComboId] = useState<string | null>(null);
  const [professionalId, setProfessionalId] = useState(defaultProfessional);
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [packages, setPackages] = useState<{
    customerId: string;
    list: CustomerPackageOption[];
  } | null>(null);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const existingId = customer && "id" in customer ? customer.id : null;
  useEffect(() => {
    if (!existingId) return;
    getCustomerPackagesAction(existingId).then((list) =>
      setPackages({ customerId: existingId, list }),
    );
  }, [existingId]);
  const usablePackages =
    packages?.customerId === existingId && serviceIds.length === 1 && !comboId
      ? packages.list.filter((p) => p.serviceId === serviceIds[0])
      : [];

  const hasSelection = comboId !== null || serviceIds.length > 0;
  const request = hasSelection && professionalId ? { serviceIds, comboId, professionalId } : null;

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await createManualAppointmentAction({
        serviceIds,
        comboId,
        professionalId,
        startsAt,
        customerId: existingId,
        newCustomer: customer && !("id" in customer) ? customer : null,
        customerPackageId: usablePackages.some((p) => p.id === packageId) ? packageId : null,
      });
      if (result.ok) {
        setCustomer(null);
        setServiceIds([]);
        setComboId(null);
        setStartsAt(null);
        setPackageId(null);
        onDone();
      } else setError(result.message);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FieldShell name="customer" label="Cliente">
            <CustomerPicker value={customer} onChange={setCustomer} />
          </FieldShell>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Serviços</legend>
            {catalog.combos.length > 0 ? (
              <select
                aria-label="Combo"
                value={comboId ?? ""}
                onChange={(e) => {
                  setComboId(e.target.value || null);
                  setServiceIds([]);
                  setStartsAt(null);
                }}
                className={selectClass}
              >
                <option value="">Escolher serviços avulsos</option>
                {catalog.combos.map((c) => (
                  <option key={c.id} value={c.id}>
                    Combo: {c.name} · {formatBRL(c.priceCents)}
                  </option>
                ))}
              </select>
            ) : null}
            {!comboId
              ? catalog.services.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={serviceIds.includes(s.id)}
                      onCheckedChange={(checked) => {
                        setServiceIds((current) =>
                          checked ? [...current, s.id] : current.filter((id) => id !== s.id),
                        );
                        setStartsAt(null);
                      }}
                    />
                    {s.name} · {formatDuration(s.durationMinutes)} · {formatBRL(s.priceCents)}
                  </label>
                ))
              : null}
          </fieldset>

          {usablePackages.length > 0 ? (
            <FieldShell name="package" label="Pacote da cliente">
              <select
                id="package"
                value={packageId ?? ""}
                onChange={(e) => setPackageId(e.target.value || null)}
                className={selectClass}
              >
                <option value="">Não usar pacote</option>
                {usablePackages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sessionsLeft} sessões restantes)
                  </option>
                ))}
              </select>
            </FieldShell>
          ) : null}

          {catalog.professionals.length > 1 ? (
            <FieldShell name="professional" label="Profissional">
              <select
                id="professional"
                value={professionalId}
                onChange={(e) => {
                  setProfessionalId(e.target.value);
                  setStartsAt(null);
                }}
                className={selectClass}
              >
                {catalog.professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </FieldShell>
          ) : null}

          <SlotPicker
            request={request}
            value={startsAt}
            onChange={setStartsAt}
            defaultDate={defaultDate}
          />

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button
            type="button"
            className="h-11"
            disabled={!customer || !startsAt || pending}
            onClick={submit}
          >
            {pending ? "Agendando…" : "Agendar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BlockDialog({
  open,
  onOpenChange,
  professionals,
  defaultDate,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionals: { id: string; name: string }[];
  defaultDate: string;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bloquear horário</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            startTransition(async () => {
              const result = await blockTimeAction({
                professionalId: form.get("professionalId"),
                date: form.get("date"),
                start: form.get("start"),
                end: form.get("end"),
                reason: form.get("reason") || undefined,
              });
              if (result.ok) onDone();
              else setError(result.message ?? "Não foi possível bloquear.");
            });
          }}
        >
          {professionals.length > 1 ? (
            <FieldShell name="professionalId" label="Profissional">
              <select id="professionalId" name="professionalId" className={selectClass}>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </FieldShell>
          ) : (
            <input type="hidden" name="professionalId" value={professionals[0]?.id ?? ""} />
          )}
          <FieldShell name="date" label="Dia">
            <Input id="date" name="date" type="date" defaultValue={defaultDate} className="h-10" />
          </FieldShell>
          <div className="grid grid-cols-2 gap-3">
            <FieldShell name="start" label="Das">
              <Input id="start" name="start" type="time" defaultValue="12:00" className="h-10" />
            </FieldShell>
            <FieldShell name="end" label="Até">
              <Input id="end" name="end" type="time" defaultValue="13:00" className="h-10" />
            </FieldShell>
          </div>
          <FieldShell name="reason" label="Motivo (só você vê)">
            <Input id="reason" name="reason" maxLength={200} className="h-10" />
          </FieldShell>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Bloqueando…" : "Bloquear"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
