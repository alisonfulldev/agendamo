/**
 * How a visitor first arrived at the sales site (first touch), kept in the browser for 30 days so
 * the sign-up can say where the account came from even after in-site navigation, the ?criar=1
 * button (which replaces the query) or the confirmation e-mail opening another tab.
 * Only tags, domains and paths: never a full URL or anything about the person.
 */
export interface Arrival {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  /** Domain of the referring site (never the full address). */
  referrer?: string;
  /** Ad click id seen in the address ("google" for gclid/gbraid/wbraid, "meta" for fbclid). */
  click?: "google" | "meta";
  /** First page of the visit. */
  landing?: string;
  /** When it was saved (ms). */
  at: number;
}

export const ARRIVAL_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;

/** Address parameters that may reach Google Analytics: campaign tags and ad click ids only. */
export const CAMPAIGN_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
] as const;

/** The arrival described by the current page: its query, the referring page and its path. */
export function arrivalFrom({
  search,
  referrer,
  host,
  path,
  now,
}: {
  search: string;
  referrer: string;
  host: string;
  path: string;
  now: number;
}): Arrival {
  const params = new URLSearchParams(search);
  const arrival: Arrival = { at: now, landing: path.slice(0, 200) };
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim().slice(0, 100);
    if (value) arrival[key] = value;
  }
  try {
    const from = referrer ? new URL(referrer).host : "";
    if (from && from !== host) arrival.referrer = from.slice(0, 200);
  } catch {
    // Unreadable referrer: no referring site.
  }
  if (params.has("gclid") || params.has("gbraid") || params.has("wbraid")) arrival.click = "google";
  else if (params.has("fbclid")) arrival.click = "meta";
  return arrival;
}

/** True when the arrival says where it came from (tag, click id or referring site). */
export function hasOrigin(arrival: Arrival): boolean {
  return Boolean(arrival.utm_source || arrival.click || arrival.referrer);
}

/**
 * Which arrival to keep: the saved one while it is under 30 days old (first touch), unless it was
 * a direct visit and this one says where it came from.
 */
export function keepArrival(saved: Arrival | null, fresh: Arrival): Arrival {
  if (!saved || fresh.at - saved.at > ARRIVAL_TTL_MS) return fresh;
  if (!hasOrigin(saved) && hasOrigin(fresh)) return fresh;
  return saved;
}

/** Reads a saved arrival, or null when it is missing, broken or too old. */
export function parseArrival(raw: string | null, now: number): Arrival | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Arrival>;
    if (typeof value.at !== "number" || now - value.at > ARRIVAL_TTL_MS) return null;
    return value as Arrival;
  } catch {
    return null;
  }
}

/** "?utm_source=x&gclid=y" with only the campaign parameters of `search`, or "". */
export function campaignQuery(search: string): string {
  const params = new URLSearchParams(search);
  const kept = new URLSearchParams();
  for (const key of CAMPAIGN_PARAMS) {
    const value = params.get(key);
    if (value) kept.set(key, value.slice(0, 200));
  }
  const query = kept.toString();
  return query ? `?${query}` : "";
}
