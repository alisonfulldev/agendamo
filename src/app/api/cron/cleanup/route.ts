import { cronRoute } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";

/** Daily housekeeping: abandoned bookings > 30 days, expired tokens, old rate limits and raw events. */
export const POST = cronRoute(async () => {
  const admin = createAdminClient();
  const [expired, rateLimits, events] = await Promise.all([
    admin.rpc("purge_expired"),
    admin.rpc("purge_rate_limits"),
    admin.rpc("purge_page_events"),
  ]);
  for (const r of [expired, rateLimits, events]) if (r.error) throw new Error(r.error.message);
  return { expired: expired.data, rateLimits: rateLimits.data, pageEvents: events.data };
});
