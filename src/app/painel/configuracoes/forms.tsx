"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";

import {
  WeeklyHoursEditor,
  type WorkingRangeDraft,
} from "@/components/business/weekly-hours-editor";
import { FieldShell, FormMessage, TextField } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import type { Business, PageSettings } from "@/lib/db/types";
import { initialFormState } from "@/lib/forms";
import { SEGMENT_LABELS } from "@/lib/segments";
import { BR_TIMEZONES } from "@/lib/timezones";

import {
  addTimeOffAction,
  deleteTimeOffAction,
  saveBusinessAction,
  saveHoursAction,
  savePixAction,
} from "./actions";

const selectClass = "h-10 w-full rounded-lg border border-input bg-transparent px-2 text-sm";

const NOTICE_OPTIONS = [
  [0, "Sem antecedência"],
  [30, "30 minutos"],
  [60, "1 hora"],
  [120, "2 horas"],
  [240, "4 horas"],
  [720, "12 horas"],
  [1440, "1 dia"],
  [2880, "2 dias"],
] as const;

function Select({
  name,
  label,
  defaultValue,
  options,
  error,
  hint,
}: {
  name: string;
  label: string;
  defaultValue: string | number;
  options: readonly (readonly [string | number, string])[];
  error?: string;
  hint?: string;
}) {
  return (
    <FieldShell name={name} label={label} error={error} hint={hint}>
      <select id={name} name={name} defaultValue={String(defaultValue)} className={selectClass}>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function BusinessSettingsForm({ business }: { business: Business }) {
  const [state, action] = useActionState(saveBusinessAction, initialFormState);
  const v = state.values;
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="name" label="Nome do negócio" defaultValue={business.name} state={state} />
        <TextField
          name="slug"
          label="Seu link"
          defaultValue={business.slug}
          hint="Trocar o endereço quebra links já divulgados."
          state={state}
        />
        <Select
          name="segment"
          label="Segmento"
          defaultValue={v?.segment ?? business.segment}
          options={Object.entries(SEGMENT_LABELS)}
          error={state.errors?.segment}
        />
        <Select
          name="timezone"
          label="Fuso horário"
          defaultValue={v?.timezone ?? business.timezone}
          options={BR_TIMEZONES.map((t) => [t.value, t.label] as const)}
          error={state.errors?.timezone}
        />
        <Select
          name="slot_interval_minutes"
          label="Grade de horários"
          defaultValue={v?.slot_interval_minutes ?? business.slot_interval_minutes}
          options={[
            [15, "A cada 15 minutos"],
            [30, "A cada 30 minutos"],
            [60, "A cada 1 hora"],
          ]}
        />
        <Select
          name="min_notice_minutes"
          label="Antecedência mínima"
          defaultValue={v?.min_notice_minutes ?? business.min_notice_minutes}
          options={NOTICE_OPTIONS}
        />
        <TextField
          name="max_days_ahead"
          label="Agendar até quantos dias à frente"
          type="number"
          min={1}
          max={365}
          defaultValue={business.max_days_ahead}
          state={state}
        />
        <Select
          name="booking_confirmation"
          label="Confirmação dos agendamentos"
          defaultValue={v?.booking_confirmation ?? business.booking_confirmation}
          options={[
            ["auto", "Automática"],
            ["manual", "Eu aprovo cada um"],
          ]}
        />
        <TextField
          name="no_show_limit"
          label="Limite de faltas (opcional)"
          type="number"
          min={1}
          max={20}
          defaultValue={business.no_show_limit ?? ""}
          hint="Acima disso, a cliente só consegue pedir horário para você aprovar."
          state={state}
        />
      </div>
      <label className="flex items-center justify-between gap-3 rounded-xl border p-3">
        <span>
          <span className="font-medium">Não aparecer no portal</span>
          <span className="block text-sm text-muted-foreground">
            Seu negócio deixa de ser listado nas buscas do portal da marca.
          </span>
        </span>
        <Switch name="portal_opt_out" defaultChecked={business.portal_opt_out} />
      </label>
      <FormMessage state={state} />
      <SubmitButton className="self-start" pendingLabel="Salvando…">
        Salvar
      </SubmitButton>
    </form>
  );
}

export function HoursForm({
  professionals,
}: {
  professionals: { id: string; name: string; hours: WorkingRangeDraft[] }[];
}) {
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id ?? "");
  const current = professionals.find((p) => p.id === professionalId);
  const [drafts, setDrafts] = useState<Record<string, WorkingRangeDraft[]>>(() =>
    Object.fromEntries(professionals.map((p) => [p.id, p.hours])),
  );
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  if (!current) return null;

  return (
    <div className="flex flex-col gap-4">
      {professionals.length > 1 ? (
        <FieldShell name="hours-professional" label="Profissional">
          <select
            id="hours-professional"
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
            className={selectClass}
          >
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </FieldShell>
      ) : null}
      <WeeklyHoursEditor
        value={drafts[professionalId] ?? []}
        onChange={(ranges) => setDrafts((d) => ({ ...d, [professionalId]: ranges }))}
      />
      <Button
        type="button"
        className="self-start"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await saveHoursAction({
              professionalId,
              ranges: drafts[professionalId],
            });
            setMessage(
              result.ok
                ? { ok: true, text: "Expediente salvo." }
                : { ok: false, text: result.error ?? "Erro" },
            );
          })
        }
      >
        {pending ? "Salvando…" : "Salvar expediente"}
      </Button>
      {message ? (
        <p
          role={message.ok ? "status" : "alert"}
          className={`text-sm ${message.ok ? "text-primary" : "text-destructive"}`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}

export function TimeOffForm({
  professionals,
  entries,
}: {
  professionals: { id: string; name: string }[];
  entries: { id: string; label: string; professional: string }[];
}) {
  const router = useRouter();
  const [state, action] = useActionState(addTimeOffAction, initialFormState);
  const [allDay, setAllDay] = useState(true);
  const [, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      {entries.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 rounded-xl border p-3 text-sm">
              <span className="min-w-0 flex-1">
                {entry.label}
                {professionals.length > 1 ? (
                  <span className="text-muted-foreground"> · {entry.professional}</span>
                ) : null}
              </span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Remover bloqueio"
                onClick={() =>
                  startTransition(async () => {
                    await deleteTimeOffAction(entry.id);
                    router.refresh();
                  })
                }
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum bloqueio futuro.</p>
      )}

      <form action={action} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-2" noValidate>
        {professionals.length > 1 ? (
          <div className="sm:col-span-2">
            <FieldShell name="professional_id" label="Profissional">
              <select id="professional_id" name="professional_id" className={selectClass}>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </FieldShell>
          </div>
        ) : (
          <input type="hidden" name="professional_id" value={professionals[0]?.id ?? ""} />
        )}
        <TextField name="start_date" label="De" type="date" state={state} />
        <TextField name="end_date" label="Até" type="date" state={state} />
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <Checkbox
            name="all_day"
            checked={allDay}
            onCheckedChange={(c) => setAllDay(c === true)}
          />
          Dia inteiro
        </label>
        {!allDay ? (
          <>
            <TextField name="start_time" label="Das" type="time" state={state} />
            <TextField name="end_time" label="Às" type="time" state={state} />
          </>
        ) : null}
        <div className="sm:col-span-2">
          <TextField
            name="reason"
            label="Motivo (só você vê)"
            placeholder="Férias, curso…"
            state={state}
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <FormMessage state={state} />
          <SubmitButton variant="outline" className="self-start" pendingLabel="Salvando…">
            Adicionar bloqueio
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}

export function PixForm({ settings }: { settings: PageSettings | null }) {
  const [state, action] = useActionState(savePixAction, initialFormState);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      <TextField
        name="pix_key"
        label="Chave Pix"
        defaultValue={settings?.pix_key ?? ""}
        hint="O sinal cai direto na sua conta. A plataforma não recebe nada."
        state={state}
      />
      <TextField
        name="pix_receiver_name"
        label="Nome de quem recebe"
        maxLength={25}
        defaultValue={settings?.pix_receiver_name ?? ""}
        state={state}
      />
      <Select
        name="deposit_deadline_minutes"
        label="Prazo para pagar o sinal"
        defaultValue={
          state.values?.deposit_deadline_minutes ?? settings?.deposit_deadline_minutes ?? 60
        }
        options={[
          [15, "15 minutos"],
          [30, "30 minutos"],
          [60, "1 hora"],
          [120, "2 horas"],
          [360, "6 horas"],
          [720, "12 horas"],
          [1440, "24 horas"],
        ]}
      />
      <div className="flex flex-col gap-2 sm:col-span-2">
        <FormMessage state={state} />
        <SubmitButton className="self-start" pendingLabel="Salvando…">
          Salvar Pix
        </SubmitButton>
      </div>
    </form>
  );
}
