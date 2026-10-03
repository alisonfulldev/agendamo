import { NextResponse } from "next/server";

import { isDemoMode } from "@/lib/demo/mode";
import { readDemoObject } from "@/lib/demo/storage";

/** Serves files uploaded in demo mode (the local stand-in for the R2 public domain). */
export async function GET(_request: Request, { params }: RouteContext<"/api/demo/files/[...key]">) {
  if (!isDemoMode()) return new NextResponse(null, { status: 404 });
  const { key } = await params;
  const path = key.join("/");
  const body = readDemoObject(path);
  if (!body) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": path.endsWith(".svg") ? "image/svg+xml" : "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
