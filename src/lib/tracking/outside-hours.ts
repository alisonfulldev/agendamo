import { formatInTimeZone } from "date-fns-tz";

export interface WeeklyRange {
  weekday: number;
  start_time: string;
  end_time: string;
}

/** True when no professional of the business is working at `now` in its timezone. */
export function isOutsideHours(now: Date, timezone: string, ranges: WeeklyRange[]): boolean {
  const weekday = Number(formatInTimeZone(now, timezone, "i")) % 7; // ISO 1=Mon..7=Sun -> 0=Sun
  const time = formatInTimeZone(now, timezone, "HH:mm");
  return !ranges.some(
    (r) =>
      r.weekday === weekday &&
      r.start_time.slice(0, 5) <= time &&
      time < (r.end_time.slice(0, 5) === "24:00" ? "24:01" : r.end_time.slice(0, 5)),
  );
}
