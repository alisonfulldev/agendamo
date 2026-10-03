import { createClient } from "@supabase/supabase-js";

import { createDemoClient } from "@/lib/demo/client";
import { isDemoMode } from "@/lib/demo/mode";
import { getClientEnv } from "@/lib/env";

/**
 * Cookie-less anon client for public reads that may be cached across visitors
 * (no session, so the result never depends on who is looking). Uses only public RPCs.
 */
export function createAnonClient() {
  if (isDemoMode()) return createDemoClient("anon", null);
  const env = getClientEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
