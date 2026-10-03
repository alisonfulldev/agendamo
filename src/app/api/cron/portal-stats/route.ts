import { cronRoute } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";

/** Daily: rebuilds this month's portal aggregates (and last month's during the first days). Idempotent. */
export const POST = cronRoute(async () => {
  const admin = createAdminClient();
  const today = new Date();
  const days = [today.toISOString().slice(0, 10)];
  if (today.getUTCDate() <= 2) {
    const lastMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 15));
    days.push(lastMonth.toISOString().slice(0, 10));
  }
  for (const day of days) {
    const { error } = await admin.rpc("refresh_portal_stats", { p_day: day });
    if (error) throw new Error(error.message);
  }
  return { months: days };
});
