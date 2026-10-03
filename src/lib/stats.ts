import { formatInTimeZone } from "date-fns-tz";

import { addDaysToDate } from "@/lib/availability";

/** Aggregated numbers below this are never shown (rule 5). */
export const MIN_DISPLAY_COUNT = 5;

/** "menos de 5" for small numbers; the number otherwise. */
export function displayCount(value: number): string {
  if (value === 0) return "0";
  return value < MIN_DISPLAY_COUNT ? "menos de 5" : value.toLocaleString("pt-BR");
}

/** Monday of the week containing `now` in `timezone`, "YYYY-MM-DD". */
export function weekStart(now: Date, timezone: string): string {
  const today = formatInTimeZone(now, timezone, "yyyy-MM-dd");
  const isoWeekday = Number(formatInTimeZone(now, timezone, "i")); // 1 = Monday
  return addDaysToDate(today, -(isoWeekday - 1));
}

export interface DailyStats {
  date: string;
  counts: Record<string, number>;
  outside_hours: Record<string, number>;
}

export interface WeekTotals {
  views: number;
  /** People who started the conversation (first answer in "Agendar" or "Pedir horário"). */
  conversations: number;
  /** Clicks on the profile links (Instagram, own links, WhatsApp when there is no time). */
  links: number;
  requests: number;
  bookings: number;
  outsideHours: number;
}

/** Sums daily rows within [from, from + 7 days). "Outside hours" = conversations started while closed. */
export function sumWeek(rows: DailyStats[], from: string): WeekTotals {
  const to = addDaysToDate(from, 7);
  const totals: WeekTotals = {
    views: 0,
    conversations: 0,
    links: 0,
    requests: 0,
    bookings: 0,
    outsideHours: 0,
  };
  for (const row of rows) {
    if (row.date < from || row.date >= to) continue;
    totals.views += row.counts.view ?? 0;
    totals.conversations += (row.counts.booking_started ?? 0) + (row.counts.request_started ?? 0);
    totals.links +=
      (row.counts.click_instagram ?? 0) +
      (row.counts.click_link ?? 0) +
      (row.counts.click_whatsapp ?? 0);
    totals.requests += row.counts.request_sent ?? 0;
    totals.bookings += row.counts.booking_confirmed ?? 0;
    totals.outsideHours +=
      (row.outside_hours.booking_started ?? 0) + (row.outside_hours.request_started ?? 0);
  }
  return totals;
}
