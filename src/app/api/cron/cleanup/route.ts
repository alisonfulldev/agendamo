import { cronRoute } from "@/lib/cron";
import { deleteObject, isStorageConfigured } from "@/lib/storage/r2";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Daily housekeeping: abandoned bookings > 30 days, expired tokens, old rate limits, raw events and
 * demonstrations older than 7 days (with their photos).
 */
export const POST = cronRoute(async () => {
  const admin = createAdminClient();
  const [expired, rateLimits, events, demos, codes] = await Promise.all([
    admin.rpc("purge_expired"),
    admin.rpc("purge_rate_limits"),
    admin.rpc("purge_page_events"),
    admin.rpc("purge_expired_demos"),
    admin.rpc("purge_email_codes"),
  ]);
  for (const r of [expired, rateLimits, events, demos, codes])
    if (r.error) throw new Error(r.error.message);
  const photos = ((demos.data ?? []) as { photo_key: string | null }[])
    .map((d) => d.photo_key)
    .filter((key): key is string => Boolean(key));
  if (photos.length && isStorageConfigured()) {
    await Promise.all(photos.map((key) => deleteObject(key).catch(() => undefined)));
  }
  return {
    expired: expired.data,
    rateLimits: rateLimits.data,
    pageEvents: events.data,
    demos: (demos.data ?? []).length,
    emailCodes: codes.data,
  };
});
