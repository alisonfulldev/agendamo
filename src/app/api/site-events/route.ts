import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { rateLimitRequest } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOT_PATTERN } from "@/lib/tracking/events";
import { siteEventSchema } from "@/lib/tracking/site-events";

const noContent = () => new NextResponse(null, { status: 204 });

/**
 * Anonymous funnel events of the marketing pages (rule 5): page views and clicks on "Criar meu
 * link". Bots and signed-in users (owners browsing) are ignored; nothing personal is stored.
 */
export async function POST(request: Request) {
  if (BOT_PATTERN.test(request.headers.get("user-agent") ?? "")) return noContent();
  if (!(await rateLimitRequest("events"))) return new NextResponse(null, { status: 429 });

  const body = await request.text().catch(() => "");
  let json: unknown = null;
  try {
    json = JSON.parse(body);
  } catch {
    json = null;
  }
  const parsed = siteEventSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (await getSessionUser()) return noContent();

  const event = parsed.data;
  const { error } = await createAdminClient().from("site_events").insert({
    type: event.type,
    path: event.path,
    template: event.template,
    niche: event.niche,
    landing: event.landing,
    experiment: event.experiment,
    session_id: event.sessionId,
  });
  if (error) console.error("site event insert failed", error.message);
  return noContent();
}
