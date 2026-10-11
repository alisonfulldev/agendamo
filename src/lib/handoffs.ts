import "server-only";

import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import type { Business } from "@/lib/db/types";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Customers the chat sent to the owner's WhatsApp this month (waiting mode), in the business's
 * time zone. Anonymous count of "handoff_sent" events; the owner's own visits are never counted.
 * Shown on the subscription screen with any number (decided 2026-10-12).
 */
export async function handoffsThisMonth(
  business: Pick<Business, "id" | "timezone">,
  now: Date = new Date(),
): Promise<number> {
  const month = formatInTimeZone(now, business.timezone, "yyyy-MM");
  const start = fromZonedTime(`${month}-01T00:00:00`, business.timezone);
  const { count } = await createAdminClient()
    .from("page_events")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("type", "handoff_sent")
    .gte("occurred_at", start.toISOString());
  return count ?? 0;
}
