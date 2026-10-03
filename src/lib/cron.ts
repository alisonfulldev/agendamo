import "server-only";

import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { getServerEnv } from "@/lib/env";

/** True when the request carries `Authorization: Bearer <CRON_SECRET>` (rule 8). */
export function isAuthorizedCron(request: Request): boolean {
  const secret = getServerEnv().CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/**
 * Wraps a cron route: checks the secret, runs the job and reports what it did.
 * Jobs must be idempotent: running twice never sends or counts twice.
 */
export function cronRoute(job: (request: Request) => Promise<Record<string, unknown>>) {
  return async function handler(request: Request) {
    if (!isAuthorizedCron(request))
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const started = Date.now();
    try {
      const result = await job(request);
      return NextResponse.json({ ok: true, ms: Date.now() - started, ...result });
    } catch (error) {
      console.error("cron job failed", error);
      return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
    }
  };
}
