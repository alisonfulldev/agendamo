"use client";

import { ChevronLeft, ChevronRight, Lock, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { addDaysToDate, localToUtc } from "@/lib/availability";
import { WEEKDAY_SHORT } from "@/lib/segments";

import { rescheduleAction } from "./actions";
import { AppointmentSheet } from "./appointment-sheet";
import { BlockDialog, NewAppointmentDialog } from "./dialogs";
import type { AgendaAppointment, AgendaBlock, AgendaCatalog } from "./types";

const PX_PER_MINUTE = 1.2;
const SNAP_MINUTES = 15;

function statusClass(status: AgendaAppointment["status"]): string {
  switch (status) {
    case "confirmed":
      return "bg-primary text-primary-foreground";
    case "pending":
    case "awaiting_deposit":
      return "border-2 border-dashed border-primary bg-accent text-accent-foreground";
    case "completed":
      return "bg-muted text-muted-foreground";
    case "no_show":
      return "bg-destructive/15 text-destructive line-through";
    default:
      return "bg-muted text-muted-foreground opacity-60 line-through";
  }
}

function formatDay(date: string) {
  const [y, m, d] = date.split("-");
  const weekday = WEEKDAY_SHORT[new Date(`${date}T12:00:00Z`).getUTCDay()];
  return `${weekday}, ${d}/${m}${y !== String(new Date().getFullYear()) ? `/${y}` : ""}`;
}

export function AgendaView(props: {
  view: "day" | "week";
  date: string;
  from: string;
  today: string;
  timezone: string;
  appointments: AgendaAppointment[];
  blocks: AgendaBlock[];
  catalog: AgendaCatalog;
  visibleProfessionals: { id: string; name: string }[];
  selectedProfessional: string | null;
  dayStartMinute: number;
  dayEndMinute: number;
  canFilterProfessionals: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<AgendaAppointment | null>(null);
  const [creating, setCreating] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [dragging, setDragging] = useState<AgendaAppointment | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const appointments = useMemo(
    () => props.appointments.filter((a) => showCancelled || a.status !== "cancelled"),
    [props.appointments, showCancelled],
  );

  function go(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    router.push(`/painel/agenda?${params.toString()}`);
  }

  const step = props.view === "week" ? 7 : 1;
  const days =
    props.view === "week"
      ? Array.from({ length: 7 }, (_, i) => addDaysToDate(props.from, i))
      : [props.date];
  const totalMinutes = props.dayEndMinute - props.dayStartMinute;
  const hours = Array.from({ length: totalMinutes / 60 }, (_, i) => props.dayStartMinute / 60 + i);

  function drop(event: React.DragEvent<HTMLDivElement>, date: string, professionalId: string) {
    event.preventDefault();
    if (!dragging) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const minute =
      props.dayStartMinute +
      Math.round((event.clientY - rect.top) / PX_PER_MINUTE / SNAP_MINUTES) * SNAP_MINUTES;
    const time = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
    const appointment = dragging;
    setDragging(null);
    startTransition(async () => {
      const result = await rescheduleAction({
        id: appointment.id,
        startsAt: localToUtc(date, time, props.timezone).toISOString(),
        professionalId: professionalId !== appointment.professionalId ? professionalId : undefined,
      });
      setMessage(
        result.ok
          ? "Agendamento movido. A cliente foi avisada por e-mail."
          : (result.message ?? "Não foi possível mover."),
      );
      router.refresh();
    });
  }

  const columns = props.view === "day" ? props.visibleProfessionals : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Anterior"
            onClick={() => go({ date: addDaysToDate(props.date, -step) })}
          >
            <ChevronLeft />
          </Button>
          <Button type="button" variant="outline" onClick={() => go({ date: props.today })}>
            Hoje
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Próximo"
            onClick={() => go({ date: addDaysToDate(props.date, step) })}
          >
            <ChevronRight />
          </Button>
          <h1 className="ml-2 text-xl font-bold">
            {props.view === "week" ? `Semana de ${formatDay(props.from)}` : formatDay(props.date)}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Visão" className="flex rounded-lg border p-0.5">
            {(["day", "week"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={props.view === v}
                onClick={() => go({ view: v })}
                className={`rounded-md px-3 py-1 text-sm ${props.view === v ? "bg-primary text-primary-foreground" : ""}`}
              >
                {v === "day" ? "Dia" : "Semana"}
              </button>
            ))}
          </div>
          {props.canFilterProfessionals ? (
            <select
              aria-label="Profissional"
              value={props.selectedProfessional ?? ""}
              onChange={(e) => go({ pro: e.target.value || null })}
              className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
            >
              <option value="">Todos</option>
              {props.catalog.professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : null}
          <Button type="button" variant="outline" onClick={() => setBlocking(true)}>
            <Lock /> Bloquear
          </Button>
          <Button type="button" onClick={() => setCreating(true)}>
            <Plus /> Agendar
          </Button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={showCancelled}
          onChange={(e) => setShowCancelled(e.target.checked)}
          className="accent-primary"
        />
        Mostrar cancelados
      </label>
      {message ? (
        <p role="status" className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
          {message}
        </p>
      ) : null}

      {props.view === "day" ? (
        <div className="overflow-x-auto rounded-xl border bg-card" aria-busy={pending}>
          <div className="flex min-w-fit">
            <div className="w-14 shrink-0 border-r">
              <div className="h-10 border-b" />
              <div className="relative" style={{ height: totalMinutes * PX_PER_MINUTE }}>
                {hours.map((h, i) => (
                  <span
                    key={h}
                    className="absolute right-2 -translate-y-2 text-xs text-muted-foreground"
                    style={{ top: i * 60 * PX_PER_MINUTE }}
                  >
                    {String(h).padStart(2, "0")}:00
                  </span>
                ))}
              </div>
            </div>
            {columns.map((pro) => (
              <div key={pro.id} className="min-w-[180px] flex-1 border-r last:border-r-0">
                <div className="flex h-10 items-center justify-center border-b px-2 text-sm font-medium">
                  {pro.name}
                </div>
                <div
                  className="relative"
                  style={{ height: totalMinutes * PX_PER_MINUTE }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => drop(e, props.date, pro.id)}
                >
                  {hours.map((h, i) => (
                    <div
                      key={h}
                      className="absolute inset-x-0 border-t border-dashed"
                      style={{ top: i * 60 * PX_PER_MINUTE }}
                    />
                  ))}
                  {props.blocks
                    .filter((b) => b.professionalId === pro.id && b.date === props.date)
                    .map((b) => (
                      <div
                        key={`${b.id}-${b.date}`}
                        className="absolute inset-x-1 overflow-hidden rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                        style={{
                          top: Math.max(0, b.startMinute - props.dayStartMinute) * PX_PER_MINUTE,
                          height: Math.max(
                            18,
                            (Math.min(b.endMinute, props.dayEndMinute) -
                              Math.max(b.startMinute, props.dayStartMinute)) *
                              PX_PER_MINUTE,
                          ),
                        }}
                      >
                        <Lock className="mr-1 inline size-3" />
                        Bloqueado {b.label}
                        {b.reason ? ` · ${b.reason}` : ""}
                      </div>
                    ))}
                  {appointments
                    .filter((a) => a.professionalId === pro.id && a.date === props.date)
                    .map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        draggable={a.status !== "cancelled" && a.status !== "completed"}
                        onDragStart={() => setDragging(a)}
                        onClick={() => setSelected(a)}
                        className={`absolute inset-x-1 overflow-hidden rounded-md px-2 py-1 text-left text-xs shadow-sm ${statusClass(a.status)}`}
                        style={{
                          top: (a.startMinute - props.dayStartMinute) * PX_PER_MINUTE,
                          height: Math.max(22, (a.endMinute - a.startMinute) * PX_PER_MINUTE),
                        }}
                      >
                        <span className="font-semibold">{a.timeLabel.split("–")[0]}</span>{" "}
                        {a.customerName}
                        <span className="block truncate opacity-90">{a.services}</span>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-7">
          {days.map((day) => {
            const items = appointments.filter((a) => a.date === day);
            const dayBlocks = props.blocks.filter((b) => b.date === day);
            return (
              <section
                key={day}
                className={`rounded-xl border bg-card p-2 ${day === props.today ? "ring-2 ring-primary" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => go({ view: "day", date: day })}
                  className="mb-2 w-full text-left text-sm font-semibold"
                >
                  {formatDay(day)}
                </button>
                <ul className="flex flex-col gap-1.5">
                  {dayBlocks.map((b) => (
                    <li
                      key={`${b.id}-${day}`}
                      className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                    >
                      <Lock className="mr-1 inline size-3" />
                      {b.label}
                    </li>
                  ))}
                  {items.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(a)}
                        className={`w-full rounded-md px-2 py-1 text-left text-xs ${statusClass(a.status)}`}
                      >
                        <span className="font-semibold">{a.timeLabel.split("–")[0]}</span>{" "}
                        {a.customerName}
                        <span className="block truncate opacity-90">{a.services}</span>
                      </button>
                    </li>
                  ))}
                  {items.length === 0 && dayBlocks.length === 0 ? (
                    <li className="text-xs text-muted-foreground">Livre</li>
                  ) : null}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <AppointmentSheet
        appointment={selected}
        timezone={props.timezone}
        catalog={props.catalog}
        onClose={() => setSelected(null)}
        onDone={(text) => {
          setSelected(null);
          setMessage(text);
          router.refresh();
        }}
      />
      <NewAppointmentDialog
        open={creating}
        onOpenChange={setCreating}
        catalog={props.catalog}
        timezone={props.timezone}
        defaultDate={props.date}
        defaultProfessional={props.selectedProfessional ?? props.catalog.professionals[0]?.id ?? ""}
        onDone={() => {
          setCreating(false);
          setMessage("Agendamento criado.");
          router.refresh();
        }}
      />
      <BlockDialog
        open={blocking}
        onOpenChange={setBlocking}
        professionals={props.catalog.professionals}
        defaultDate={props.date}
        onDone={() => {
          setBlocking(false);
          setMessage("Horário bloqueado. Ele some do seu chat na hora.");
          router.refresh();
        }}
      />
    </div>
  );
}
