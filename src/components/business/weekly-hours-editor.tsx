"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { WEEKDAY_LABELS } from "@/lib/segments";

export interface WorkingRangeDraft {
  weekday: number;
  start: string;
  end: string;
}

/** Monday first, like Brazilian calendars. */
const ORDER = [1, 2, 3, 4, 5, 6, 0];

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = Math.min(24 * 60, h! * 60 + m! + minutes);
  if (total === 24 * 60) return "24:00";
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Weekly working hours with several ranges per day (breaks = gaps between ranges). */
export function WeeklyHoursEditor({
  value,
  onChange,
}: {
  value: WorkingRangeDraft[];
  onChange: (ranges: WorkingRangeDraft[]) => void;
}) {
  const rangesOf = (weekday: number) =>
    value.filter((r) => r.weekday === weekday).sort((a, b) => a.start.localeCompare(b.start));

  const setDay = (weekday: number, ranges: WorkingRangeDraft[]) =>
    onChange([...value.filter((r) => r.weekday !== weekday), ...ranges]);

  return (
    <ul className="flex flex-col gap-3">
      {ORDER.map((weekday) => {
        const ranges = rangesOf(weekday);
        const open = ranges.length > 0;
        return (
          <li key={weekday} className="rounded-xl border bg-card p-3">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor={`day-${weekday}`} className="font-medium">
                {WEEKDAY_LABELS[weekday]}
              </label>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {open ? "Aberto" : "Fechado"}
                <Switch
                  id={`day-${weekday}`}
                  checked={open}
                  onCheckedChange={(checked) =>
                    setDay(weekday, checked ? [{ weekday, start: "09:00", end: "18:00" }] : [])
                  }
                />
              </div>
            </div>
            {open && (
              <div className="mt-3 flex flex-col gap-2">
                {ranges.map((range, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="time"
                      aria-label={`${WEEKDAY_LABELS[weekday]}: início da faixa ${index + 1}`}
                      value={range.start}
                      step={300}
                      onChange={(e) =>
                        setDay(
                          weekday,
                          ranges.map((r, i) => (i === index ? { ...r, start: e.target.value } : r)),
                        )
                      }
                      className="h-10 w-32"
                    />
                    <span className="text-muted-foreground">até</span>
                    <Input
                      type="time"
                      aria-label={`${WEEKDAY_LABELS[weekday]}: fim da faixa ${index + 1}`}
                      value={range.end === "24:00" ? "23:59" : range.end}
                      step={300}
                      onChange={(e) =>
                        setDay(
                          weekday,
                          ranges.map((r, i) => (i === index ? { ...r, end: e.target.value } : r)),
                        )
                      }
                      className="h-10 w-32"
                    />
                    {ranges.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remover faixa"
                        onClick={() =>
                          setDay(
                            weekday,
                            ranges.filter((_, i) => i !== index),
                          )
                        }
                      >
                        <X />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="self-start"
                  onClick={() => {
                    const last = ranges.at(-1)!;
                    const start = addMinutes(last.end, 60);
                    setDay(weekday, [...ranges, { weekday, start, end: addMinutes(start, 120) }]);
                  }}
                >
                  <Plus /> Adicionar faixa (após uma pausa)
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
