import { cronRoute } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";

/** Rebuilds the last 3 local days of page_stats_daily from raw events. Idempotent. */
export const POST = cronRoute(async () => {
  const since = new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await createAdminClient().rpc("refresh_page_stats", { p_since: since });
  if (error) throw new Error(error.message);
  return { since, rows: data };
});
