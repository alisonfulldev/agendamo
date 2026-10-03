import "server-only";

import { getSlots, type Catalog } from "./data";

/**
 * Real free start times on a local date, across professionals, using each professional's
 * shortest service (so every possible start shows up). Sorted "HH:mm".
 */
export async function freeTimesOn(catalog: Catalog, date: string): Promise<string[]> {
  const times = new Set<string>();
  for (const professional of catalog.professionals) {
    const offered = catalog.services.filter((s) =>
      catalog.professionalServices.some(
        (ps) => ps.professional_id === professional.id && ps.service_id === s.id,
      ),
    );
    const shortest = [...offered].sort(
      (a, b) => a.duration_minutes + a.buffer_minutes - (b.duration_minutes + b.buffer_minutes),
    )[0];
    if (!shortest) continue;
    const slots = await getSlots(
      { catalog, services: [shortest], professional: professional.id },
      date,
    );
    for (const slot of slots) times.add(slot.time);
  }
  return [...times].sort();
}
