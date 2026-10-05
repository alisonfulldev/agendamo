/** "14:00, 15:30 e 17:00" */
export function joinTimes(times: string[]): string {
  if (times.length <= 1) return times.join("");
  return `${times.slice(0, -1).join(", ")} e ${times.at(-1)}`;
}

/**
 * Ready text for the WhatsApp status or Instagram with the real free times of a day and the
 * booking link. Empty when the day has no free time (nothing to announce).
 */
export function freeSlotsMessage({
  businessName,
  day,
  times,
  url,
  max = 8,
}: {
  businessName: string;
  day: "hoje" | "amanhã";
  times: string[];
  url: string;
  max?: number;
}): string {
  if (times.length === 0) return "";
  return `Horários livres ${day} em ${businessName}: ${listTimes(times, max)}. Agende pelo link: ${url}`;
}

/** Up to `max` times: "09:00, 10:00 e 11:00", or "09:00, 10:00 e outros" when there are more. */
export function listTimes(times: string[], max = 8): string {
  return times.length > max ? `${times.slice(0, max).join(", ")} e outros` : joinTimes(times);
}
