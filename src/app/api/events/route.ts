import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth/session";
import { rateLimitRequest } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOT_PATTERN, PAGE_EVENT_TYPES } from "@/lib/tracking/events";
import { isOutsideHours } from "@/lib/tracking/outside-hours";

const eventSchema = z.object({
  businessId: z.uuid(),
  type: z.enum(PAGE_EVENT_TYPES),
  sessionId: z.uuid(),
  // Small, non-personal context only (e.g. which link). Keys/values are length-limited.
  meta: z.record(z.string().max(40), z.string().max(120)).default({}),
});

const noContent = () => new NextResponse(null, { status: 204 });

/** Anonymous page events. Stores no IP and no personal data (rule 5). */
export async function POST(request: Request) {
  if (BOT_PATTERN.test(request.headers.get("user-agent") ?? "")) return noContent();
  if (!(await rateLimitRequest("events"))) return new NextResponse(null, { status: 429 });

  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data.meta).length > 5) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const { businessId, type, sessionId, meta } = parsed.data;
  const admin = createAdminClient();

  // Owner/staff browsing their own page are not counted.
  const user = await getSessionUser();
  if (user) {
    const { data: member } = await admin
      .from("members")
      .select("id")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (member) return noContent();
  }

  const [{ data: business }, { data: hours }] = await Promise.all([
    admin.from("businesses").select("timezone").eq("id", businessId).maybeSingle(),
    admin
      .from("working_hours")
      .select("weekday, start_time, end_time")
      .eq("business_id", businessId),
  ]);
  if (!business) return noContent();

  const { error } = await admin.from("page_events").insert({
    business_id: businessId,
    type,
    session_id: sessionId,
    outside_hours: isOutsideHours(new Date(), business.timezone as string, hours ?? []),
    meta,
  });
  if (error) console.error("page event insert failed", error.message);
  return noContent();
}
