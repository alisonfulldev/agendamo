import "server-only";

import type { TimeRange } from "@/lib/availability";
import { dataCache } from "@/lib/cache";

import { calendarFetch, getConnection } from "./client";

const CACHE_SECONDS = 120;

async function fetchBusy(
  professionalId: string,
  fromIso: string,
  toIso: string,
): Promise<{ start: string; end: string }[]> {
  const connection = await getConnection(professionalId);
  if (!connection) return [];
  try {
    const response = await calendarFetch(connection, "/freeBusy", {
      method: "POST",
      body: JSON.stringify({
        timeMin: fromIso,
        timeMax: toIso,
        items: [{ id: connection.calendar_id }],
      }),
    });
    if (!response.ok) return [];
    const data = (await response.json()) as {
      calendars?: Record<string, { busy?: { start: string; end: string }[] }>;
    };
    return data.calendars?.[connection.calendar_id]?.busy ?? [];
  } catch (error) {
    // A Google outage must not break booking: fall back to internal availability only.
    console.error("google freeBusy failed", error);
    return [];
  }
}

/**
 * Busy times from the professional's Google Calendar, cached briefly (personal events disappear
 * from the chat within minutes). The cache key includes the brand (rule 14).
 */
export async function getExternalBusy(
  professionalId: string,
  from: Date,
  to: Date,
  brandKey: string,
): Promise<TimeRange[]> {
  const fromIso = from.toISOString();
  const toIso = to.toISOString();
  const busy = await dataCache(
    () => fetchBusy(professionalId, fromIso, toIso),
    ["gcal-busy", brandKey, professionalId, fromIso, toIso],
    {
      revalidate: CACHE_SECONDS,
      tags: [`gcal:${professionalId}`],
    },
  )();
  return busy.map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
}
