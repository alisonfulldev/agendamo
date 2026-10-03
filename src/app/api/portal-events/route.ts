import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentBrand } from "@/brands/server";
import { rateLimitRequest } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOT_PATTERN } from "@/lib/tracking/events";

const schema = z.object({
  type: z.enum(["search", "view", "click"]),
  sessionId: z.uuid(),
  city: z.string().max(80).nullable().default(null),
  neighborhood: z.string().max(80).nullable().default(null),
  service: z.string().max(80).nullable().default(null),
  slugs: z.array(z.string().max(40)).max(50).default([]),
});

/** Anonymous portal events with the brand of the domain (Prompt 36). No IP or personal data. */
export async function POST(request: Request) {
  if (BOT_PATTERN.test(request.headers.get("user-agent") ?? ""))
    return new NextResponse(null, { status: 204 });
  if (!(await rateLimitRequest("events"))) return new NextResponse(null, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const brand = await getCurrentBrand();
  const { type, sessionId, city, neighborhood, service, slugs } = parsed.data;
  const admin = createAdminClient();

  let businessIds: (string | null)[] = [null];
  if (slugs.length) {
    const { data } = await admin
      .from("businesses")
      .select("id")
      .eq("brand_key", brand.key)
      .in("slug", slugs);
    businessIds = (data ?? []).map((b) => b.id as string);
    if (businessIds.length === 0) return new NextResponse(null, { status: 204 });
  }
  await admin.from("portal_events").insert(
    businessIds.map((businessId) => ({
      brand_key: brand.key,
      city,
      neighborhood,
      service_slug: service,
      business_id: businessId,
      type,
      session_id: sessionId,
    })),
  );
  return new NextResponse(null, { status: 204 });
}
