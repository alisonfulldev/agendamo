"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { getAgendaSlotsAction, type AgendaSlot } from "./actions";

/** Date input + free slots computed by the engine on the server. */
export function SlotPicker({
  request,
  value,
  onChange,
  defaultDate,
}: {
  /** Selection to look up; null disables the picker. */
  request: {
    serviceIds: string[];
    comboId: string | null;
    professionalId: string;
    excludeAppointmentId?: string;
  } | null;
  value: string | null;
  onChange: (startsAt: string | null) => void;
  defaultDate: string;
}) {
  const [date, setDate] = useState(defaultDate);
  const [result, setResult] = useState<{ key: string; slots: AgendaSlot[] } | null>(null);
  const key = request ? JSON.stringify({ ...request, date }) : "";
  const slots = result?.key === key ? result.slots : null;

  useEffect(() => {
    if (!request) return;
    let cancelled = false;
    getAgendaSlotsAction({ ...request, date })
      .then(
        (list) =>
          !cancelled && setResult({ key: JSON.stringify({ ...request, date }), slots: list }),
      )
      .catch(
        () => !cancelled && setResult({ key: JSON.stringify({ ...request, date }), slots: [] }),
      );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures request + date
  }, [key]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slot-date">Dia</Label>
        <Input
          id="slot-date"
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            onChange(null);
          }}
          className="h-10 w-48"
        />
      </div>
      {!request ? (
        <p className="text-sm text-muted-foreground">
          Escolha o serviço para ver os horários livres.
        </p>
      ) : slots === null ? (
        <p className="text-sm text-muted-foreground">Buscando horários…</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum horário livre nesse dia.</p>
      ) : (
        <div role="radiogroup" aria-label="Horários livres" className="flex flex-wrap gap-2">
          {slots.map((slot) => (
            <button
              key={slot.startsAt}
              type="button"
              role="radio"
              aria-checked={value === slot.startsAt}
              onClick={() => onChange(slot.startsAt)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${value === slot.startsAt ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}
            >
              {slot.time}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
