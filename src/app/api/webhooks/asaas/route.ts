import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { handleAsaasEvent, type AsaasEvent } from "@/lib/billing/service";
import { getServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

const eventSchema = z
  .object({
    id: z.string().min(1).max(100),
    event: z.string().min(1).max(80),
    payment: z
      .object({
        id: z.string(),
        subscription: z.string().optional(),
        status: z.string(),
        value: z.number(),
        dueDate: z.string(),
        invoiceUrl: z.string().default(""),
        billingType: z.string().default(""),
      })
      .passthrough()
      .optional(),
    subscription: z
      .object({ id: z.string(), status: z.string().optional() })
      .passthrough()
      .optional(),
  })
  .passthrough();

function validToken(received: string | null): boolean {
  const expected = getServerEnv().ASAAS_WEBHOOK_TOKEN;
  if (!expected || !received) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Asaas webhook. Validates the asaas-access-token header and processes each event id once
 * (Asaas delivers "at least once", so repeats are expected).
 */
export async function POST(request: Request) {
  if (!validToken(request.headers.get("asaas-access-token"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const event = parsed.data as unknown as AsaasEvent;

  const admin = createAdminClient();
  const { error: duplicate } = await admin
    .from("webhook_events")
    .insert({ id: event.id, event: event.event });
  if (duplicate) {
    if (duplicate.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
    return NextResponse.json({ error: "storage" }, { status: 500 });
  }

  try {
    const result = await handleAsaasEvent(event);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    // Let Asaas retry: forget the event id so the next delivery is processed.
    await admin.from("webhook_events").delete().eq("id", event.id);
    console.error("asaas webhook failed", error);
    return NextResponse.json({ error: "processing" }, { status: 500 });
  }
}
