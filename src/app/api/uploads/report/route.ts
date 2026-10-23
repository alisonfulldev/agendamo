import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth/session";
import { IMAGE_KINDS } from "@/lib/images/presets";
import { rateLimit } from "@/lib/rate-limit";

const reportSchema = z.object({
  kind: z.enum(IMAGE_KINDS),
  /** Step that failed in the browser (read, prepare, sign, put, save). */
  step: z.string().max(20),
  error: z.string().max(200),
  type: z.string().max(100),
  sizeKb: z.number().int().nonnegative().max(1_000_000),
  browser: z.string().max(200),
});

/**
 * Upload failures seen by the owner's browser, written to the log so they can be fixed from the
 * real error. Only the step, the error, the file type and size and the browser: no image, no name.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return new NextResponse(null, { status: 204 });
  if (!(await rateLimit("upload", `report:${user.id}`))) {
    return new NextResponse(null, { status: 204 });
  }
  const parsed = reportSchema.safeParse(await request.json().catch(() => null));
  if (parsed.success) console.error("photo upload failed in the browser", parsed.data);
  return new NextResponse(null, { status: 204 });
}
