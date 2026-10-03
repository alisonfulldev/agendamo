import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { createDemoClient } from "@/lib/demo/client";
import { isDemoMode } from "@/lib/demo/mode";
import { getClientEnv } from "@/lib/env";

/** Supabase client for Server Components, Server Actions and Route Handlers (user session, RLS applies). */
export async function createClient() {
  const cookieStore = await cookies();
  if (isDemoMode()) {
    return createDemoClient("user", {
      get: (name) => cookieStore.get(name)?.value,
      set(name, value) {
        try {
          cookieStore.set(name, value, { httpOnly: true, sameSite: "lax", path: "/" });
        } catch {
          // Read-only in Server Components.
        }
      },
      delete(name) {
        try {
          cookieStore.delete(name);
        } catch {
          // Read-only in Server Components.
        }
      },
    });
  }
  const env = getClientEnv();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only. Safe to ignore
          // as long as session refresh happens elsewhere (proxy / route handler).
        }
      },
    },
  });
}
