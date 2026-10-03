import { sendReminder } from "@/lib/booking/notify";
import { cronRoute } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";

/** Hourly: reminder 24h before each confirmed appointment, once (notification_log). */
export const POST = cronRoute(async () => {
  const now = Date.now();
  const { data, error } = await createAdminClient()
    .from("appointments")
    .select("id")
    .eq("status", "confirmed")
    .gte("starts_at", new Date(now + 23 * 3_600_000).toISOString())
    .lt("starts_at", new Date(now + 25 * 3_600_000).toISOString());
  if (error) throw new Error(error.message);
  let sent = 0;
  for (const row of data ?? []) if (await sendReminder(row.id as string)) sent++;
  return { candidates: data?.length ?? 0, sent };
});
