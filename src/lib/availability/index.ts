import { addMinutes } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/** A busy interval in absolute time, end exclusive. */
export interface TimeRange {
  start: Date;
  end: Date;
}

/** A working interval in the business's local time ("HH:mm" or "HH:mm:ss"; "24:00" allowed as end). */
export interface WorkingRange {
  startTime: string;
  endTime: string;
}

/** One service of the block, in booking order. The buffer is busy time after the service. */
export interface ServiceStep {
  durationMinutes: number;
  bufferMinutes: number;
  /** Resources (rooms, chairs) the step needs during its duration + buffer. */
  resourceIds: string[];
}

export interface AvailabilityInput {
  /** Local date in the business timezone, "YYYY-MM-DD". */
  date: string;
  timezone: string;
  /** Working ranges of the professional for this weekday. */
  workingHours: WorkingRange[];
  timeOff: TimeRange[];
  /** Appointments of the professional that hold time (confirmed, pending, awaiting_deposit). */
  appointments: TimeRange[];
  /** Busy times from external calendars (Google). */
  externalBusy: TimeRange[];
  services: ServiceStep[];
  /** Busy intervals per resource id. */
  resourceBusy: Record<string, TimeRange[]>;
  slotIntervalMinutes: number;
  minNoticeMinutes: number;
  maxDaysAhead: number;
  now: Date;
}

export interface Slot {
  /** UTC ISO strings. endsAt includes buffers (what the appointment row stores). */
  startsAt: string;
  endsAt: string;
  /** Start in the business timezone, "HH:mm". */
  time: string;
}

export interface BlockStep {
  start: Date;
  /** End of the service itself. */
  serviceEnd: Date;
  /** End including the buffer. */
  end: Date;
  resourceIds: string[];
}

export interface Block {
  start: Date;
  end: Date;
  steps: BlockStep[];
}

const overlaps = (start: Date, end: Date, range: TimeRange) =>
  start < range.end && range.start < end;

/** Local wall-clock time in `timezone` to an absolute Date. */
export function localToUtc(date: string, time: string, timezone: string): Date {
  const hhmm = time.slice(0, 5);
  if (hhmm === "24:00") return fromZonedTime(`${addDaysToDate(date, 1)}T00:00:00`, timezone);
  return fromZonedTime(`${date}T${hhmm}:00`, timezone);
}

/** "YYYY-MM-DD" of `now` in `timezone`. */
export function todayIn(timezone: string, now: Date): string {
  return formatInTimeZone(now, timezone, "yyyy-MM-dd");
}

export function addDaysToDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` ("YYYY-MM-DD"). */
export function daysBetween(from: string, to: string): number {
  return Math.round(
    (new Date(`${to}T12:00:00Z`).getTime() - new Date(`${from}T12:00:00Z`).getTime()) / 86_400_000,
  );
}

/** 0 (Sunday) to 6 (Saturday), matching working_hours.weekday. */
export function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

/** Lays out a block of sequential services starting at `start`. */
export function layoutBlock(start: Date, services: ServiceStep[]): Block {
  const steps: BlockStep[] = [];
  let cursor = start;
  for (const service of services) {
    const serviceEnd = addMinutes(cursor, service.durationMinutes);
    const end = addMinutes(serviceEnd, service.bufferMinutes);
    steps.push({ start: cursor, serviceEnd, end, resourceIds: service.resourceIds });
    cursor = end;
  }
  return { start, end: cursor, steps };
}

/** Total busy minutes of a block (durations + buffers). */
export function blockMinutes(services: ServiceStep[]): number {
  return services.reduce((total, s) => total + s.durationMinutes + s.bufferMinutes, 0);
}

function isBookableDay(
  input: Pick<AvailabilityInput, "date" | "timezone" | "now" | "maxDaysAhead">,
) {
  const offset = daysBetween(todayIn(input.timezone, input.now), input.date);
  return offset >= 0 && offset <= input.maxDaysAhead;
}

/**
 * Free start times for one professional on one day. A start is valid only if the whole block
 * (all services + buffers) fits inside one working range, does not touch any busy time, and every
 * required resource is free during the step that needs it.
 */
export function getAvailableSlots(input: AvailabilityInput): Slot[] {
  if (input.services.length === 0 || !isBookableDay(input)) return [];

  const total = blockMinutes(input.services);
  const earliest = addMinutes(input.now, input.minNoticeMinutes);
  const busy = [...input.appointments, ...input.timeOff, ...input.externalBusy];
  const slots = new Map<string, Slot>();

  for (const range of input.workingHours) {
    const rangeStart = localToUtc(input.date, range.startTime, input.timezone);
    const rangeEnd = localToUtc(input.date, range.endTime, input.timezone);

    for (
      let start = rangeStart;
      addMinutes(start, total) <= rangeEnd;
      start = addMinutes(start, input.slotIntervalMinutes)
    ) {
      if (start < earliest) continue;
      const block = layoutBlock(start, input.services);
      if (busy.some((range) => overlaps(block.start, block.end, range))) continue;

      const resourceTaken = block.steps.some((step) =>
        step.resourceIds.some((id) =>
          (input.resourceBusy[id] ?? []).some((range) => overlaps(step.start, step.end, range)),
        ),
      );
      if (resourceTaken) continue;

      const startsAt = block.start.toISOString();
      slots.set(startsAt, {
        startsAt,
        endsAt: block.end.toISOString(),
        time: formatInTimeZone(block.start, input.timezone, "HH:mm"),
      });
    }
  }

  return [...slots.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export interface ProfessionalAvailability {
  professionalId: string;
  workingHours: WorkingRange[];
  timeOff: TimeRange[];
  appointments: TimeRange[];
  externalBusy: TimeRange[];
  /** Steps with this professional's duration/price overrides applied. */
  services: ServiceStep[];
}

export type AnyProfessionalInput = Omit<
  AvailabilityInput,
  "workingHours" | "timeOff" | "appointments" | "externalBusy" | "services"
> & { professionals: ProfessionalAvailability[] };

export interface AnyProfessionalSlot extends Slot {
  /** Professionals free at this start, in the given order. */
  professionalIds: string[];
  endsAtByProfessional: Record<string, string>;
}

/** Union of free starts across professionals who do every chosen service. */
export function getAvailableSlotsAnyProfessional(
  input: AnyProfessionalInput,
): AnyProfessionalSlot[] {
  const byStart = new Map<string, AnyProfessionalSlot>();
  for (const professional of input.professionals) {
    const slots = getAvailableSlots({ ...input, ...professional });
    for (const slot of slots) {
      const existing = byStart.get(slot.startsAt);
      if (existing) {
        existing.professionalIds.push(professional.professionalId);
        existing.endsAtByProfessional[professional.professionalId] = slot.endsAt;
      } else {
        byStart.set(slot.startsAt, {
          ...slot,
          professionalIds: [professional.professionalId],
          endsAtByProfessional: { [professional.professionalId]: slot.endsAt },
        });
      }
    }
  }
  return [...byStart.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/**
 * Round robin for "any professional": whoever has the fewest appointments that day.
 * Ties go to the earlier candidate (list order = professional position).
 */
export function pickProfessional(
  candidateIds: string[],
  appointmentsToday: Record<string, number>,
): string | null {
  let best: string | null = null;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const id of candidateIds) {
    const count = appointmentsToday[id] ?? 0;
    if (count < bestCount) {
      best = id;
      bestCount = count;
    }
  }
  return best;
}

export interface AvailableDay {
  date: string;
  slotCount: number;
}

/** Days from `fromDate` (inclusive) for `days` days that have at least one free slot. */
export function getAvailableDays({
  fromDate,
  days,
  buildInput,
}: {
  fromDate: string;
  days: number;
  /** Availability for one date, or null when nobody works that day. */
  buildInput: (date: string) => AvailabilityInput | null;
}): AvailableDay[] {
  const result: AvailableDay[] = [];
  for (let offset = 0; offset < days; offset++) {
    const date = addDaysToDate(fromDate, offset);
    const dayInput = buildInput(date);
    if (!dayInput) continue;
    const slotCount = getAvailableSlots(dayInput).length;
    if (slotCount > 0) result.push({ date, slotCount });
  }
  return result;
}
