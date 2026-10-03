import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Uptime monitoring (Prompt 40): 200 when the app and the database answer, 503 otherwise. */
export async function GET() {
  const started = Date.now();
  let database = false;
  if (hasSupabaseEnv()) {
    try {
      const { error } = await createAdminClient().from("reserved_slugs").select("slug").limit(1);
      database = !error;
    } catch {
      database = false;
    }
  }
  return NextResponse.json(
    { ok: database, database, ms: Date.now() - started, time: new Date().toISOString() },
    { status: database ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
