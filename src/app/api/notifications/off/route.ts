import { NextResponse, type NextRequest } from "next/server";

import { optOut, readOptOutToken } from "@/lib/notifications/opt-out";
import { rateLimitRequest } from "@/lib/rate-limit";

/** One-click opt-out (RFC 8058): mail clients POST here from the List-Unsubscribe header. */
export async function POST(request: NextRequest) {
  if (!(await rateLimitRequest("publicAction", "unsubscribe")))
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const target = readOptOutToken(request.nextUrl.searchParams.get("t"));
  if (!target) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await optOut(target.userId, target.type);
  return NextResponse.json({ ok: true });
}
