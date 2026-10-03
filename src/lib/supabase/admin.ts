import "server-only";

import { createClient } from "@supabase/supabase-js";

import { createDemoClient } from "@/lib/demo/client";
import { isDemoMode } from "@/lib/demo/mode";
import { getServerEnv } from "@/lib/env";

/**
 * Service role client: bypasses RLS. Server only (cron, webhooks, admin tasks).
 * Always filter by business_id explicitly when using it.
 */
export function createAdminClient() {
  if (isDemoMode()) return createDemoClient("admin", null);
  const env = getServerEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
