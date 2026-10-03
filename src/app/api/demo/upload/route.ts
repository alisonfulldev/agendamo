import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { isDemoMode } from "@/lib/demo/mode";
import { demoUploadSignature, writeDemoObject } from "@/lib/demo/storage";

/** Demo stand-in for a presigned R2 PUT: checks the signature, type and size, then stores the file. */
export async function PUT(request: NextRequest) {
  if (!isDemoMode()) return new NextResponse(null, { status: 404 });
  const params = request.nextUrl.searchParams;
  const key = params.get("key") ?? "";
  const type = params.get("type") ?? "";
  const length = Number(params.get("len"));
  const expected = Buffer.from(demoUploadSignature(key, type, length));
  const given = Buffer.from(params.get("sig") ?? "");
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return new NextResponse("SignatureDoesNotMatch", { status: 403 });
  }
  if (request.headers.get("content-type") !== type) {
    return new NextResponse("Content-Type mismatch", { status: 403 });
  }
  const body = Buffer.from(await request.arrayBuffer());
  if (body.length !== length) return new NextResponse("Content-Length mismatch", { status: 403 });
  writeDemoObject(key, body);
  return new NextResponse(null, { status: 200 });
}
