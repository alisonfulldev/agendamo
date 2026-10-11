// Shared list of page event types (matches the page_events.type check in SQL).

export const PAGE_EVENT_TYPES = [
  "view",
  "click_whatsapp",
  "click_instagram",
  "click_link",
  "click_book",
  "request_started",
  "request_sent",
  "booking_started",
  "booking_confirmed",
  /** Waiting mode: the chat sent the customer to the owner's WhatsApp with the request. */
  "handoff_sent",
] as const;

export type PageEventType = (typeof PAGE_EVENT_TYPES)[number];

export const SESSION_COOKIE = "lv_sid";
export const SESSION_MAX_AGE_SECONDS = 30 * 60;

/** User agents that are never counted (crawlers, previews, monitors). */
export const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|embedly|vercel|lighthouse|headless|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch/i;
