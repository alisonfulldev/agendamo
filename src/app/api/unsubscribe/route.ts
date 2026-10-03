import { NextResponse, type NextRequest } from "next/server";

import { rateLimitRequest } from "@/lib/rate-limit";
import { readUnsubscribeToken, unsubscribe } from "@/lib/unsubscribe";

/** One-click unsubscribe (RFC 8058): mail clients POST here from the List-Unsubscribe header. */
export async function POST(request: NextRequest) {
  if (!(await rateLimitRequest("publicAction", "unsubscribe")))
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const target = readUnsubscribeToken(request.nextUrl.searchParams.get("t"));
  if (!target) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await unsubscribe(target.email, target.businessId);
  return NextResponse.json({ ok: true });
}
